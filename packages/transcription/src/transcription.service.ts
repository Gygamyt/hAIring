import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssemblyAI } from 'assemblyai';
import * as fs from 'fs/promises'; // Используем асинхронный модуль 'fs'

@Injectable()
export class TranscriptionService {
    private readonly logger = new Logger(TranscriptionService.name);
    private client: AssemblyAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('ASSEMBLYAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('AssemblyAI API key not configured in .env file!');
        }
        this.client = new AssemblyAI({
            apiKey: apiKey,
        });
    }

    /**
     * Транскрибирует аудиофайл, используя AssemblyAI.
     * Node.js SDK автоматически обрабатывает загрузку и опрос статуса.
     * @param audioPath Путь к локальному аудиофайлу.
     * @returns Текст транскрипции.
     */
    async transcribe(audioPath: string): Promise<string> {
        this.logger.log(`Starting audio transcription for file: ${audioPath}`);

        try {
            const stats = await fs.stat(audioPath);
            this.logger.log(`Source file found. Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB.`);
        } catch (error) {
            this.logger.error(`Failed to access source file at ${audioPath}: ${error.message}`);
            throw new Error(`Audio file not found at ${audioPath}`);
        }

        try {
            const transcript = await this.client.transcripts.transcribe({
                audio: audioPath,
                language_detection: true,
            });

            if (transcript.status === 'error') {
                this.logger.error(`Transcription failed with error: ${transcript.error}`);
                throw new Error(`Transcription failed: ${transcript.error}`);
            }

            this.logger.log('Transcription completed successfully.');
            if (!transcript.text) {
                this.logger.warn('Transcription returned empty text.');
            }

            return transcript.text ?? '';
        } catch (error) {
            this.logger.error(`An unexpected error occurred during the transcription process: ${error.message}`, error.stack);
            throw error;
        } finally {
        }
    }
}
