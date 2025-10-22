import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import chalk from 'chalk';
import { GoogleDriveService } from '@hairing/google-drive';
import { TranscriptionService } from '@hairing/transcription';
import { DocumentParserService } from '@hairing/document-parser';
import path from "node:path";
import * as os from "node:os";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "node:fs";
// TODO: Import AI pipeline later
// import { POST_INTERVIEW_PIPELINE_PROVIDER } from '@hairing/nest-ai';
// import { CompiledStateGraph } from '@langchain/langgraph';

@Injectable()
export class ResultsService {
    private readonly logger = new Logger(ResultsService.name);

    constructor(
        @InjectQueue('analysis-workflow') private readonly analysisQueue: Queue,
        private readonly googleDriveService: GoogleDriveService,
        private readonly transcriptionService: TranscriptionService,
        private readonly documentParserService: DocumentParserService,
        // TODO: Inject AI pipeline later
        // @Inject(POST_INTERVIEW_PIPELINE_PROVIDER)
        // private readonly postInterviewPipeline: CompiledStateGraph<...>,
    ) {}

    /**
     * STEP 1: Download sheet texts and parse CV. Get video link.
     * On success, creates Job 2 (Transcribe).
     */
    async runDownloadStep(job: Job): Promise<any> {
        const { parentJobId } = job.data;
        this.logger.log(`[Job ${parentJobId}] Step 1: Downloading artifacts...`);
        const {
            video_link,
            competency_matrix_link,
            department_values_link,
            employee_portrait_link,
            job_requirements_link,
            cvFileBuffer,
            cvFileName,
        } = job.data.payload;

        try {
            const [
                matrixText,
                valuesText,
                portraitText,
                requirementsText
            ] = await Promise.all([
                this.googleDriveService.downloadSheet(competency_matrix_link),
                this.googleDriveService.downloadSheet(department_values_link),
                this.googleDriveService.downloadSheet(employee_portrait_link),
                this.googleDriveService.downloadSheet(job_requirements_link),
            ]);
            this.logger.log(`[Job ${parentJobId}] Sheets downloaded successfully.`);

            let cvText = "CV was not provided for this analysis.";
            if (cvFileBuffer && cvFileName) {
                this.logger.log(`[Job ${parentJobId}] Parsing CV: ${cvFileName}`);
                const buffer = Buffer.isBuffer(cvFileBuffer) ? cvFileBuffer : Buffer.from(cvFileBuffer.data);
                cvText = await this.documentParserService.read(buffer, cvFileName);
                this.logger.log(`[Job ${parentJobId}] CV parsed successfully.`);
            } else {
                this.logger.log(`[Job ${parentJobId}] No CV provided.`);
            }

            const nextJobPayload = {
                video_link,
                matrixText,
                valuesText,
                portraitText,
                requirementsText,
                cvText,
                cvFileName,
            };

            await this.addNextJob(parentJobId, 'job-2-transcribe', nextJobPayload);
            this.logger.log(`[Job ${parentJobId}] Step 1 complete. Enqueued job-2-transcribe.`);

            // FIX: Correct updateJobProgress call
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'downloaded' });
            return { download: 'success' };

        } catch (error: any) {
            this.logger.error(`[Job ${parentJobId}] Step 1 failed during download/parse: ${error.message}`, error.stack);
            // FIX: Correct updateJobProgress call
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'failed' });
            throw error;
        }
    }


    async runTranscriptionStep(job: Job): Promise<any> {
        const { parentJobId, payload } = job.data;
        this.logger.warn(`[Job ${parentJobId}] RUNNING FILE-BASED TRANSCRIPTION STEP.`);
        const {
            video_link,
            matrixText,
            valuesText,
            portraitText,
            requirementsText,
            cvText,
            cvFileName
        } = payload;

        let tempVideoPath: string | null = null;
        let tempAudioPath: string | null = null;

        try {
            this.logger.log(`[Job ${parentJobId}] Getting video metadata...`);
            const metadata = await this.googleDriveService.getFileMetadata(video_link);
            if (!metadata || metadata.size === 0) {
                throw new Error(`Could not get valid metadata or size for video: ${video_link}`);
            }

            tempVideoPath = path.join(os.tmpdir(), `video-${parentJobId}-${Date.now()}${path.extname(metadata.name) || '.tmp'}`);
            this.logger.log(`[Job ${parentJobId}] Downloading video file temporarily to ${tempVideoPath}...`);

            await this.googleDriveService.downloadFileToTemp(video_link, tempVideoPath, metadata.size);

            this.logger.log(`[Job ${parentJobId}] Video downloaded: ${tempVideoPath}`);

            tempAudioPath = path.join(os.tmpdir(), `audio-${parentJobId}-${Date.now()}.wav`);
            this.logger.log(`[Job ${parentJobId}] Extracting audio to WAV: ${tempAudioPath}`);
            await new Promise<void>((resolve, reject) => {
                ffmpeg(tempVideoPath!)
                    .noVideo()
                    .audioCodec('pcm_s16le')
                    .audioChannels(1)
                    .audioFrequency(16000)
                    .outputOptions('-y')
                    .format('wav')
                    .on('start', cmd => this.logger.log(`[Job ${parentJobId}] ffmpeg started: ${cmd}`))
                    .on('stderr', line => this.logger.warn(`[Job ${parentJobId}] ${chalk.yellow('[ffmpeg stderr]')}: ${line.trim()}`))
                    .on('error', (err, stdout, stderr) => {
                        this.logger.error(`[Job ${parentJobId}] ffmpeg error: ${err.message}`);
                        this.logger.error(`ffmpeg stderr on error:\n${stderr}`);
                        reject(err);
                    })
                    .on('end', () => {
                        this.logger.log(`[Job ${parentJobId}] Audio extraction complete.`);
                        resolve();
                    })
                    .save(tempAudioPath!);
            });

            this.logger.log(`[Job ${parentJobId}] Transcribing audio file: ${tempAudioPath}`);
            const transcriptionResult = await this.transcriptionService.transcribeFile(tempAudioPath, {
                languageCode: 'ru',
                languageDetection: false,
                punctuate: true,
                formatText: true,
                speakerLabels: true,
                speakersExpected: 2,
            });

            if (!transcriptionResult || transcriptionResult.text === null) {
                throw new Error('Transcription failed or returned null text.');
            }
            this.logger.log(`[Job ${parentJobId}] Transcription complete (${transcriptionResult.text.length} chars). Language: ${transcriptionResult.detectedLanguage || 'ru'}`);
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'transcribed' });

            const nextJobPayload = {
                transcriptionText: transcriptionResult.text,
                // words: transcriptionResult.words,
                // utterances: transcriptionResult.utterances,
                matrixText,
                valuesText,
                portraitText,
                requirementsText,
                cvText,
                cvFileName,
            };
            await this.addNextJob(parentJobId, 'job-3-run-ai', nextJobPayload);
            this.logger.log(`[Job ${parentJobId}] Enqueued job-3-run-ai.`);

            return { transcription: 'success', audioId: transcriptionResult.audioId };

        } catch (error: any) {
            this.logger.error(`[Job ${parentJobId}] Transcription step failed: ${error.message}`, error.stack);
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'failed' });
            throw error;
        } finally {
            this.logger.log(`[Job ${parentJobId}] Cleaning up temp files.`);
            this.cleanupTempFile(tempVideoPath, parentJobId, 'video');
            this.cleanupTempFile(tempAudioPath, parentJobId, 'audio');
        }
    }

    /**
     * STEP 3: Receive transcription and STOP (for testing).
     * Logs the received data and completes the job successfully.
     */
    async runAiPipelineStep(job: Job): Promise<any> {
        const { parentJobId, payload } = job.data;
        this.logger.log(`[Job ${parentJobId}] Step 3: Received data for AI Processing (TEST STUB)`);
        const {
            transcriptionText,
            matrixText,
            valuesText,
            portraitText,
            requirementsText,
            cvText,
            cvFileName
        } = payload;

        try {
            this.logger.log(`[Job ${parentJobId}] Received CV Text Length: ${cvText?.length ?? 0} (Filename: ${cvFileName || 'N/A'})`);
            this.logger.log(`[Job ${parentJobId}] Received Matrix Text Length: ${matrixText?.length ?? 0}`);
            this.logger.log(`[Job ${parentJobId}] Received Transcription Text Length: ${transcriptionText?.length ?? 0}`);
            this.logger.log(`[Job ${parentJobId}] --- Transcription Start ---`);
            console.log(transcriptionText ? transcriptionText.substring(0, 500) + '...' : 'Transcription was empty.');
            this.logger.log(`[Job ${parentJobId}] --- Transcription End ---`);
            this.logger.log(`[Job ${parentJobId}] Step 3 complete (TEST STUB). Skipping actual AI analysis.`);

            const finalResponse = {
                message: "Analysis steps (Download, Transcribe) completed successfully. AI step stubbed.",
                success: true,
                report: {
                    ai_summary: "AI analysis was skipped in this test.",
                    candidate_info: { full_name: cvFileName || "N/A", experience_years: "N/A", tech_stack: [], projects: [], domains: [], tasks: [] },
                    interview_analysis: { topics: [], tech_assignment: "N/A", knowledge_assessment: "N/A" },
                    communication_skills: { assessment: "N/A" },
                    foreign_languages: { assessment: "N/A" },
                    team_fit: "N/A",
                    additional_information: [],
                    conclusion: { recommendation: "N/A", assessed_level: "N/A", summary: "N/A" },
                    recommendations_for_candidate: []
                }
            };

            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'completed (stub)', report: finalResponse });
            return finalResponse;

        } catch (error: any) {
            this.logger.error(`[Job ${parentJobId}] Step 3 failed during stub processing: ${error.message}`, error.stack);
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'failed' });
            throw error;
        }
    }

    /**
     * Helper to create the next job in the chain.
     */
    private async addNextJob(parentJobId: string, jobName: string, payload: any) {
        await this.analysisQueue.add(jobName, {
            parentJobId,
            payload,
        }, {
            // attempts: 3,
            // backoff: { type: 'exponential', delay: 5000 },
        });
        this.logger.log(`[Job ${parentJobId}] Enqueued next step: ${chalk.yellow(jobName)}`);
    }

    private cleanupTempFile(filePath: string | null, parentJobId: string, fileType: string): void {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                this.logger.log(`[Job ${parentJobId}] Deleted temp ${fileType} file: ${filePath}`);
            } catch (cleanupError: any) {
                this.logger.error(`[Job ${parentJobId}] Error deleting temp ${fileType} file (${filePath}): ${cleanupError.message}`);
            }
        }
    }
}
