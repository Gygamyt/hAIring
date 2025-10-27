import { Injectable, Logger } from '@nestjs/common';
import { GoogleDriveService } from '@hairing/google-drive';
import { TranscriptionService, TranscriptionResult } from '@hairing/transcription';
import path from "node:path";
import * as os from "node:os";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "node:fs";
import chalk from "chalk";

@Injectable()
export class TranscriptionOrchestrationService {
    private readonly logger = new Logger(TranscriptionOrchestrationService.name);

    constructor(
        private readonly googleDriveService: GoogleDriveService,
        private readonly transcriptionService: TranscriptionService,
    ) {}

    /**
     * Handles Step 2: Download video, extract audio, transcribe using file-based method.
     * @param jobData The payload containing links and previously downloaded texts.
     * @returns The payload for the next job (AI step), including transcription text.
     */
    async run(jobData: {
        parentJobId: string;
        payload: {
            video_link: string;
            matrixText: string;
            valuesText: string;
            portraitText: string;
            requirementsText: string;
            cvText: string;
            cvFileName?: string;
        }
    }): Promise<any> {
        const { parentJobId, payload } = jobData;
        const { video_link, matrixText, valuesText, portraitText, requirementsText, cvText, cvFileName } = payload; // Destructure all for clarity
        this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Starting Step 2...`);

        let tempVideoPath: string | null = null;
        let tempAudioPath: string | null = null;

        try {
            // --- SECTION: Get Metadata ---
            this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Getting video metadata...`);
            const metadata = await this.googleDriveService.getFileMetadata(video_link);
            if (!metadata || metadata.size === 0) {
                throw new Error(`Could not get valid metadata or size for video: ${video_link}`);
            }
            // --- END SECTION ---

            // --- SECTION: Download Video ---
            tempVideoPath = path.join(os.tmpdir(), `video-${parentJobId}-${Date.now()}${path.extname(metadata.name) || '.tmp'}`);
            this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Downloading video to ${tempVideoPath}...`);
            // Assuming downloadFileToTemp is the correct method name that uses progress and returns path
            await this.googleDriveService.downloadFileToTemp(video_link, tempVideoPath, metadata.size);
            this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Video downloaded successfully.`);
            // --- END SECTION ---

            // --- SECTION: Extract Audio ---
            tempAudioPath = path.join(os.tmpdir(), `audio-${parentJobId}-${Date.now()}.wav`);
            this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Extracting audio to WAV: ${tempAudioPath}`);
            await new Promise<void>((resolve, reject) => {
                ffmpeg(tempVideoPath!) // Add non-null assertion
                    .noVideo()
                    .audioCodec('pcm_s16le') // Explicit codec for WAV
                    .audioChannels(1) // Mono
                    .audioFrequency(16000) // 16kHz
                    .outputOptions('-y') // Overwrite if exists
                    .format('wav') // Explicitly set format
                    .on('start', cmd => this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) ffmpeg started: ${cmd}`))
                    .on('stderr', line => this.logger.warn(`[Job ${parentJobId}] ${chalk.yellow('[ffmpeg stderr]')}: ${line.trim()}`))
                    .on('error', (err, stdout, stderr) => {
                        this.logger.error(`[Job ${parentJobId}] (TranscriptionOrchestration) ffmpeg error: ${err.message}`);
                        this.logger.error(`ffmpeg stderr on error:\n${stderr}`); // Log stderr on error
                        reject(new Error(`ffmpeg audio extraction failed: ${err.message}`)); // Reject the promise
                    })
                    .on('end', () => {
                        this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Audio extraction complete.`);
                        resolve(); // Resolve the promise
                    })
                    .save(tempAudioPath!); // Add non-null assertion
            });
            // --- END SECTION ---

            // --- SECTION: Transcribe Audio File ---
            this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Transcribing audio file: ${tempAudioPath}`);
            const transcriptionResult: TranscriptionResult = await this.transcriptionService.transcribeFile(tempAudioPath, {
                languageCode: 'ru', // Explicitly Russian
                languageDetection: false,
                punctuate: true,
                formatText: true,
                speakerLabels: true, // Keep speaker labels enabled
                speakersExpected: 2, // Adjust if needed
            });
            // --- END SECTION ---

            if (!transcriptionResult || transcriptionResult.text === null) {
                throw new Error('Transcription failed or returned null text.');
            }
            this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Transcription complete (${transcriptionResult.text.length} chars). Language: ${transcriptionResult.detectedLanguage || 'ru'}`);

            // Return payload for the next step (AI Analysis)
            return {
                // Pass through all previous data needed by AI step
                matrixText,
                valuesText,
                portraitText,
                requirementsText,
                cvText,
                cvFileName,
                // Add the new transcription text
                transcriptionText: transcriptionResult.text,
                // Optionally pass other transcription results if AI needs them
                // words: transcriptionResult.words,
                // utterances: transcriptionResult.utterances,
            };
        } finally {
            // --- SECTION: Cleanup ---
            this.logger.log(`[Job ${parentJobId}] (TranscriptionOrchestration) Cleaning up temporary files.`);
            await this.cleanupTempFile(tempVideoPath, parentJobId, 'video');
            await this.cleanupTempFile(tempAudioPath, parentJobId, 'audio');
            // --- END SECTION ---
        }
    }

    /** Helper to safely delete a temporary file */
    private async cleanupTempFile(filePath: string | null, parentJobId: string, fileType: string): Promise<void> {
        if (filePath) {
            try {
                await fs.promises.access(filePath); // Check if exists
                await fs.promises.unlink(filePath); // Delete
                this.logger.log(`[Job ${parentJobId}] Deleted temp ${fileType} file: ${filePath}`);
            } catch (error: any) {
                // Log error only if it's not "file not found"
                if (error.code !== 'ENOENT') {
                    this.logger.error(`[Job ${parentJobId}] Error deleting temp ${fileType} file (${filePath}): ${error.message}`);
                }
                // Don't throw error during cleanup
            }
        }
    }
}
