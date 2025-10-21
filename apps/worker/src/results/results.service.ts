import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import chalk from 'chalk';
import { GoogleDriveService } from '@hairing/google-drive';
import { TranscriptionService } from '@hairing/transcription';
import { DocumentParserService } from '@hairing/document-parser';
import { Readable } from 'stream';
import { AudioChunkEmitter, AudioExtractorService } from "../audio-extractor/audio-extractor.service";
import path from "node:path";
import * as os from "node:os";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "node:fs";
// TODO: Import AI pipeline later
// import { POST_INTERVIEW_PIPELINE_PROVIDER } from '@hairing/nest-ai';
// import { CompiledStateGraph } from '@langchain/langgraph';

const SAMPLE_RATE = 16000; // Hz
const BYTES_PER_SAMPLE = 2; // s16le = 16 bit = 2 bytes
const CHANNELS = 1; // Mono
const BYTES_PER_SECOND = SAMPLE_RATE * BYTES_PER_SAMPLE * CHANNELS;
const READ_CHUNK_SIZE_BYTES = 3200; // Smaller chunk size for throttling

@Injectable()
export class ResultsService {
    private readonly logger = new Logger(ResultsService.name);

    constructor(
        @InjectQueue('analysis-workflow') private readonly analysisQueue: Queue,
        private readonly googleDriveService: GoogleDriveService,
        private readonly transcriptionService: TranscriptionService,
        private readonly documentParserService: DocumentParserService,
        private readonly audioExtractorService: AudioExtractorService,
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
            cvFileName, // <-- Already received here
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
                cvFileName, // <-- Pass cvFileName along
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

        const { video_link } = payload;
        let tempVideoPath: string | null = null;
        let tempAudioPath: string | null = null;

        try {
            // Download video
            this.logger.log(`[Job ${parentJobId}] Downloading video...`);
            tempVideoPath = await this.googleDriveService.downloadFileToTemp(video_link);
            this.logger.log(`[Job ${parentJobId}] Video downloaded: ${tempVideoPath}`);

            // Extract audio to WAV
            tempAudioPath = path.join(os.tmpdir(), `audio-${parentJobId}-${Date.now()}.wav`);
            this.logger.log(`[Job ${parentJobId}] Extracting audio to: ${tempAudioPath}`);
            await new Promise<void>((resolve, reject) => {
                ffmpeg(tempVideoPath!)
                    .noVideo()
                    .audioChannels(1)
                    .audioFrequency(16000)
                    .format('wav')
                    .on('start', cmd => this.logger.log(`[Job ${parentJobId}] ffmpeg: ${cmd}`))
                    .on('error', (err, _, stderr) => {
                        this.logger.error(`[Job ${parentJobId}] ffmpeg error: ${err.message}`);
                        this.logger.error(stderr);
                        reject(err);
                    })
                    .on('end', () => {
                        this.logger.log(`[Job ${parentJobId}] Audio extraction complete.`);
                        resolve();
                    })
                    .save(tempAudioPath!);
            });

            this.logger.log(`[Job ${parentJobId}] Transcribing audio with Russian language setting...`);
            const result = await this.transcriptionService.transcribeFile(tempAudioPath, {
                languageDetection: true,
                punctuate: true,
                formatText: true,
            });



            this.logger.log(`[Job ${parentJobId}] Transcription complete (${result.text.length} chars).`);
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'transcribed' });

            // Enqueue next job
            await this.addNextJob(parentJobId, 'job-3-run-ai', { transcription: result.text });
            this.logger.log(`[Job ${parentJobId}] Enqueued job-3-run-ai.`);

            return { transcription: 'success' };
        } catch (error: any) {
            this.logger.error(`[Job ${parentJobId}] Transcription step failed: ${error.message}`);
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'failed' });
            throw error;
        } finally {
            this.logger.log(`[Job ${parentJobId}] Cleaning up temp files.`);
            if (tempVideoPath) await fs.promises.unlink(tempVideoPath).catch(() => {});
            if (tempAudioPath) await fs.promises.unlink(tempAudioPath).catch(() => {});
        }
    }


    // /**
    //  * @deprecated THIS IS A TEMPORARY IMPLEMENTATION using file downloads.
    //  * Should be replaced with a pure stream-based ffmpeg->WebSocket pipeline.
    //  * STEP 2: Download video, extract audio to temp file, transcribe audio file stream.
    //  * On success, creates Job 3 (Run AI).
    //  */
    // async runTranscriptionStep(job: Job): Promise<any> {
    //     const { parentJobId, payload } = job.data;
    //     this.logger.warn(`[Job ${parentJobId}] RUNNING TEMPORARY FILE-BASED TRANSCRIPTION STEP.`);
    //     const { video_link, matrixText, valuesText, portraitText, requirementsText, cvText, cvFileName } = payload;
    //
    //     let tempVideoPath: string | null = null;
    //     let tempAudioPath: string | null = null;
    //     let transcriptionSession: Awaited<ReturnType<TranscriptionService['startTranscriptionSession']>> | null = null;
    //
    //     try {
    //         // --- SECTION: File Downloader (Temporary) ---
    //         this.logger.log(`[Job ${parentJobId}] Downloading video file temporarily...`);
    //         tempVideoPath = await this.googleDriveService.downloadFileToTemp(video_link);
    //         this.logger.log(`[Job ${parentJobId}] Video downloaded to: ${tempVideoPath}`);
    //         // --- END SECTION ---
    //
    //         // --- SECTION: Audio Extractor (File-based, Temporary) ---
    //         tempAudioPath = path.join(os.tmpdir(), `audio-${parentJobId}-${Date.now()}.raw`); // Use .raw or .wav
    //         this.logger.log(`[Job ${parentJobId}] Extracting audio to: ${tempAudioPath}`);
    //
    //         await new Promise<void>((resolve, reject) => {
    //             ffmpeg(tempVideoPath!)
    //                 .noVideo()
    //                 .audioChannels(1)
    //                 .audioFrequency(16000)
    //                 .outputFormat('s16le')
    //                 .on('start', (cmd) => this.logger.log(`[Job ${parentJobId}] ffmpeg started: ${cmd}`))
    //                 .on('stderr', (line) => this.logger.warn(`[Job ${parentJobId}] ${chalk.yellow('[ffmpeg stderr]')}: ${line.trim()}`))
    //                 .on('error', (err, stdout, stderr) => {
    //                     this.logger.error(`[Job ${parentJobId}] ffmpeg audio extraction error: ${err.message}`);
    //                     this.logger.error(`[Job ${parentJobId}] ffmpeg stderr on error:\n${stderr}`);
    //                     reject(new Error(`ffmpeg audio extraction failed: ${err.message}`));
    //                 })
    //                 .on('end', () => {
    //                     this.logger.log(`[Job ${parentJobId}] ffmpeg finished extracting audio.`);
    //                     resolve();
    //                 })
    //                 .save(tempAudioPath!);
    //         });
    //         // --- END SECTION ---
    //
    //         // --- SECTION: Transcription (from File Stream, Temporary) ---
    //         this.logger.log(`[Job ${parentJobId}] Creating stream from temp audio file: ${tempAudioPath}`);
    //         const audioFileStream = fs.createReadStream(tempAudioPath!, {
    //             highWaterMark: READ_CHUNK_SIZE_BYTES // Read chunks <= 32KB
    //         });
    //
    //         transcriptionSession = await this.transcriptionService.startTranscriptionSession();
    //         this.logger.log(`[Job ${parentJobId}] Transcription session started.`);
    //
    //         // --- Throttling Logic ---
    //         let isPaused = false; // Flag to manage pausing/resuming
    //
    //         audioFileStream.on('data', (chunk: Buffer | string) => {
    //             if (!(chunk instanceof Buffer) || chunk.length === 0) {
    //                 this.logger.warn(`[Job ${parentJobId}] Received invalid chunk, skipping.`);
    //                 return;
    //             }
    //
    //             // Pause the stream immediately after receiving data
    //             if (!isPaused) {
    //                 audioFileStream!.pause(); // Use non-null assertion
    //                 isPaused = true;
    //                 // this.logger.log(`[Job ${parentJobId}] Paused stream after reading chunk.`);
    //             }
    //
    //             // Send the current chunk
    //             // this.logger.log(`[Job ${parentJobId}] Sending audio chunk (${chunk.length} bytes)...`);
    //             transcriptionSession!.sendAudioChunk(chunk);
    //
    //             // Calculate chunk duration in milliseconds
    //             const chunkDurationMs = (chunk.length / BYTES_PER_SECOND) * 1000;
    //
    //             // Set a timeout to resume the stream after the chunk's duration
    //             setTimeout(() => {
    //                 if (audioFileStream && !audioFileStream.destroyed && isPaused) {
    //                     // this.logger.log(`[Job ${parentJobId}] Resuming stream after ${chunkDurationMs.toFixed(0)}ms wait.`);
    //                     audioFileStream.resume();
    //                     isPaused = false;
    //                 }
    //             }, chunkDurationMs); // Wait for the duration of the audio chunk
    //         });
    //         // --- End Throttling Logic ---
    //
    //         audioFileStream.on('end', async () => {
    //             this.logger.log(`[Job ${parentJobId}] Temp audio file stream ended.`);
    //             if (transcriptionSession) {
    //                 await transcriptionSession.finishStreaming();
    //                 this.logger.log(`[Job ${parentJobId}] Signaled end of stream to AssemblyAI.`);
    //             }
    //         });
    //         audioFileStream.on('error', (err) => {
    //             this.logger.error(`[Job ${parentJobId}] Error reading temp audio file stream: ${err.message}`);
    //             if (transcriptionSession) {
    //                 (transcriptionSession.getCompletionPromise() as any).reject?.(new Error(`Audio file stream error: ${err.message}`));
    //                 transcriptionSession.finishStreaming().catch(()=>{});
    //             }
    //         });
    //
    //         // Start piping
    //         this.logger.log(`[Job ${parentJobId}] Piping temp audio file stream to transcription session...`);
    //         // Piping will trigger 'data' and 'end'/'error' events above
    //
    //         // Wait for completion
    //         this.logger.log(`[Job ${parentJobId}] Waiting for transcription completion promise...`);
    //         const transcriptionText = await transcriptionSession.getCompletionPromise();
    //         // --- END SECTION ---
    //
    //
    //         if (transcriptionText === undefined || transcriptionText === null) {
    //             throw new Error('Transcription completed but returned undefined/null text.');
    //         }
    //         this.logger.log(`[Job ${parentJobId}] Transcription complete (${transcriptionText.length} chars).`);
    //
    //         // Enqueue Next Job
    //         const nextJobPayload = { /* ... payload ... */ };
    //         await this.addNextJob(parentJobId, 'job-3-run-ai', nextJobPayload);
    //         this.logger.log(`[Job ${parentJobId}] Step 2 complete. Enqueued job-3-run-ai.`);
    //
    //         await this.analysisQueue.updateJobProgress(parentJobId, { step: 'transcribed' });
    //         return { transcription: 'success' };
    //
    //     } catch (error: any) {
    //         this.logger.error(`[Job ${parentJobId}] Step 2 (TEMPORARY FILE METHOD) failed: ${error.message}`, error.stack);
    //         if (transcriptionSession) {
    //             await transcriptionSession.finishStreaming().catch(e => this.logger.error(`Error closing WS on failure: ${e.message}`));
    //         }
    //         await this.analysisQueue.updateJobProgress(parentJobId, { step: 'failed' });
    //         throw error;
    //     } finally {
    //         // Cleanup Temporary Files
    //         this.logger.log(`[Job ${parentJobId}] Cleaning up temporary files (if any)...`);
    //         this.cleanupTempFile(tempVideoPath, parentJobId, 'video');
    //         this.cleanupTempFile(tempAudioPath, parentJobId, 'audio');
    //     }
    // }

    /**
     * STEP 2: Get video stream from GDrive and transcribe it.
     * On success, creates Job 3 (Run AI).
     */
    async runTranscriptionStepStream(job: Job): Promise<any> {
        const { parentJobId, payload } = job.data;
        this.logger.log(`[Job ${parentJobId}] Step 2: Extracting and Transcribing...`);
        const { video_link, matrixText, valuesText, portraitText, requirementsText, cvText, cvFileName } = payload;

        let audioEmitter: AudioChunkEmitter | null = null;
        let transcriptionSession: Awaited<ReturnType<TranscriptionService['startTranscriptionSession']>> | null = null;

        try {
            // 1. Start the transcription session (connects WebSocket)
            transcriptionSession = await this.transcriptionService.startTranscriptionSession();
            this.logger.log(`[Job ${parentJobId}] Transcription session started.`);

            // 2. Get the audio chunk emitter (starts ffmpeg)
            audioEmitter = await this.audioExtractorService.getAudioChunkEmitter(video_link);
            this.logger.log(`[Job ${parentJobId}] Audio extractor emitter obtained.`);

            // 3. Set up listeners to pipe audio chunks to the session
            audioEmitter.on('audio_chunk', (chunk) => {
                // this.logger.log(`[Job ${parentJobId}] Received audio chunk (${chunk.length} bytes), sending...`); // Verbose
                transcriptionSession!.sendAudioChunk(chunk);
            });

            // Handle errors from the audio extractor (ffmpeg)
            audioEmitter.on('error', (error) => {
                this.logger.error(`[Job ${parentJobId}] Error from AudioExtractor: ${error.message}`);
                // Reject the main promise (will be caught below)
                // Need a way to link audioEmitter errors to the transcriptionSession promise
                // For now, rely on the main catch block and ensure cleanup
                if (transcriptionSession) {
                    // Try to reject the main promise if ffmpeg fails
                    (transcriptionSession.getCompletionPromise() as any).reject?.(error);
                    transcriptionSession.finishStreaming().catch(()=>{}); // Attempt cleanup
                }
                // Rethrowing here might cause unhandled rejection if promise isn't setup to catch it
                // throw error;
            });

            // Handle normal closure of the audio extractor (ffmpeg)
            audioEmitter.on('close', async () => {
                this.logger.log(`[Job ${parentJobId}] AudioExtractor finished emitting chunks.`);
                // Signal AssemblyAI that we're done sending audio
                if (transcriptionSession) {
                    await transcriptionSession.finishStreaming();
                    this.logger.log(`[Job ${parentJobId}] Signaled end of stream to AssemblyAI.`);
                }
            });

            // 4. Wait for the transcription to complete (Promise resolves/rejects based on WebSocket events)
            this.logger.log(`[Job ${parentJobId}] Waiting for transcription completion promise...`);
            const transcriptionText = await transcriptionSession.getCompletionPromise();

            if (transcriptionText === undefined || transcriptionText === null) { // Check for undefined/null just in case
                throw new Error('Transcription completed but returned undefined/null text.');
            }
            this.logger.log(`[Job ${parentJobId}] Transcription complete (${transcriptionText.length} chars).`);


            // 5. Create the next job
            const nextJobPayload = {
                transcriptionText: transcriptionText || "", // Ensure string
                matrixText, valuesText, portraitText, requirementsText, cvText, cvFileName,
            };

            await this.addNextJob(parentJobId, 'job-3-run-ai', nextJobPayload);
            this.logger.log(`[Job ${parentJobId}] Step 2 complete. Enqueued job-3-run-ai.`);

            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'transcribed' });
            return { transcription: 'success' };

        } catch (error: any) {
            this.logger.error(`[Job ${parentJobId}] Step 2 failed during transcription orchestration: ${error.message}`, error.stack);
            // Ensure WebSocket connection is closed if it was opened
            if (transcriptionSession) {
                await transcriptionSession.finishStreaming().catch(e => this.logger.error(`Error closing WS on failure: ${e.message}`));
            }
            // Ensure ffmpeg is killed if audioEmitter exists? AudioExtractorService should handle this on stream errors.
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'failed' });
            throw error;
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
            cvFileName // <-- Receive cvFileName here
        } = payload;

        try { // Added try...catch for consistency, though less likely to fail here in stub
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

            // FIX: Correct updateJobProgress call
            await this.analysisQueue.updateJobProgress(parentJobId, { step: 'completed (stub)', report: finalResponse });
            return finalResponse;

        } catch (error: any) {
            this.logger.error(`[Job ${parentJobId}] Step 3 failed during stub processing: ${error.message}`, error.stack);
            // FIX: Correct updateJobProgress call
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
            // attempts: 3, // Example retry logic
            // backoff: { type: 'exponential', delay: 5000 }, // Example backoff
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
