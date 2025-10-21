import { Injectable, Logger } from '@nestjs/common';
import { GoogleDriveService } from '@hairing/google-drive';
import { Readable, PassThrough } from 'stream';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import ffmpeg from 'fluent-ffmpeg';

const FFMPEG_OUTPUT_FORMAT = 's16le';
const FFMPEG_AUDIO_CHANNELS = 1;
const FFMPEG_SAMPLE_RATE = 16000;

export interface AudioChunkEmitter extends EventEmitter {
    on(event: 'audio_chunk', listener: (chunk: Buffer) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'close', listener: () => void): this;
    emit(event: 'audio_chunk', chunk: Buffer): boolean;
    emit(event: 'error', error: Error): boolean;
    emit(event: 'close'): boolean;
}

@Injectable()
export class AudioExtractorService {
    private readonly logger = new Logger(AudioExtractorService.name);

    constructor(private readonly googleDriveService: GoogleDriveService) {}

    /**
     * Uses fluent-ffmpeg to extract audio chunks from a video stream.
     *
     * @param videoLink The Google Drive link to the video file.
     * @returns An EventEmitter that emits 'audio_chunk', 'error', and 'close' events.
     */
    async getAudioChunkEmitter(videoLink: string): Promise<AudioChunkEmitter> {
        this.logger.log(`Starting audio extraction using fluent-ffmpeg for link: ${videoLink}`);
        const emitter = new EventEmitter() as AudioChunkEmitter;
        let videoStream: Readable | null = null;
        let command: ffmpeg.FfmpegCommand | null = null;
        const audioOutputStream = new PassThrough();

        let hasClosed = false; // Prevent double events
        const emitErrorOnce = (error: Error) => {
            if (!hasClosed) {
                hasClosed = true;
                emitter.emit('error', error);
                emitter.emit('close');
                if(videoStream && !videoStream.destroyed) videoStream.destroy();
                if (command) command.kill('SIGKILL');
            }
        };
        const emitCloseOnce = () => {
            if (!hasClosed) {
                hasClosed = true;
                emitter.emit('close');
            }
        };

        audioOutputStream.on('data', (chunk: Buffer) => {
            emitter.emit('audio_chunk', chunk);
        });
        audioOutputStream.on('error', (err) => {
            this.logger.error(`Error in audio output passthrough stream: ${err.message}`);
            emitErrorOnce(new Error(`Audio output stream error: ${err.message}`));
        });
        audioOutputStream.on('end', () => {
            this.logger.log('fluent-ffmpeg output stream (audioOutputStream) ended.');
        });

        try {
            videoStream = await this.googleDriveService.getDownloadStream(videoLink);
            this.logger.log('Obtained video download stream from Google Drive.');

            command = ffmpeg(videoStream)
                .inputOptions([])
                .noVideo()
                .audioChannels(FFMPEG_AUDIO_CHANNELS)
                .audioFrequency(FFMPEG_SAMPLE_RATE)
                .outputFormat(FFMPEG_OUTPUT_FORMAT)
                .on('start', (commandLine: any) => {
                    this.logger.log(`Spawned ffmpeg with command: ${commandLine}`);
                })
                .on('stderr', (stderrLine: string) => {
                    this.logger.warn(`${chalk.yellow('[ffmpeg stderr]')}: ${stderrLine.trim()}`);
                })
                .on('error', (err: { message: any; }, stdout: any, stderr: any) => {
                    this.logger.error(`fluent-ffmpeg processing error: ${err.message}`);
                    this.logger.error(`ffmpeg stderr on error:\n${stderr}`);
                    emitErrorOnce(new Error(`ffmpeg processing failed: ${err.message}`));
                })
                .on('end', () => {
                    this.logger.log('fluent-ffmpeg processing finished successfully.');
                    emitCloseOnce();
                });

            command?.pipe(audioOutputStream, { end: true });

            videoStream.on('error', (streamErr) => {
                this.logger.error(`Error reading video stream from Google Drive: ${streamErr.message}`);
                emitErrorOnce(new Error(`Video stream read error: ${streamErr.message}`));
            });
            videoStream.on('end', () => {
                this.logger.log('Video stream from Google Drive ended (fluent-ffmpeg input).');
            });

        } catch (error: any) {
            this.logger.error(`Error setting up fluent-ffmpeg audio extraction: ${error.message}`, error.stack);
            if (videoStream && !videoStream.destroyed) videoStream.destroy();
            emitErrorOnce(new Error(`Audio extraction setup failed: ${error.message}`));
        }

        return emitter;
    }
}
