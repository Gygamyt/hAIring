// packages/transcription/src/transcription.service.ts
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { transcriptionConfig } from './config/transcription.config';
import { AssemblyAI, RealtimeTranscriber } from 'assemblyai';
import { RealtimeConnectionService } from './realtime/realtime-connection.service';
import { RealtimeEventHandler } from './realtime/realtime-event.handler';
import { ModuleRef } from '@nestjs/core';
import { ASSEMBLYAI_CLIENT } from './constants';
import chalk from 'chalk';

@Injectable()
// Keep TranscriptionService as Singleton, but it will create Transient helpers
export class TranscriptionService {
    private readonly logger = new Logger(TranscriptionService.name);

    constructor(
        private moduleRef: ModuleRef,
        @Inject(ASSEMBLYAI_CLIENT) private client: AssemblyAI,
    ) {
        this.logger.log('AssemblyAI client injected successfully.');
    }

    /**
     * Initiates a real-time transcription session and returns handlers
     * for sending audio chunks and awaiting the final result.
     *
     * This method sets up the WebSocket connection and event listeners
     * but does not handle the audio source stream directly.
     *
     * @returns An object containing the completion promise, and methods
     * to send audio chunks and close the connection.
     * @throws If the WebSocket connection fails to establish.
     */
    async startTranscriptionSession(): Promise<{
        sendAudioChunk: (chunk: Buffer) => void;
        finishStreaming: () => Promise<void>; // Method to signal end of audio
        getCompletionPromise: () => Promise<string>;
    }> {
        this.logger.log('Starting new transcription session setup...');

        // Create Transient instances for this session
        const connectionService = await this.moduleRef.create(RealtimeConnectionService);
        const eventHandler = await this.moduleRef.create(RealtimeEventHandler);

        try {
            // 1. Establish WebSocket connection
            await connectionService.connect();
            const transcriberInstance = connectionService.getTranscriberInstance();
            if (!transcriberInstance) {
                throw new Error('Failed to get transcriber instance after connect.');
            }

            // 2. Set up event handlers
            eventHandler.setupEventHandlers(transcriberInstance);
            this.logger.log('Transcription session setup complete.');

            // 3. Return the necessary functions for the caller (ResultsService)
            return {
                /** Sends an audio chunk over the established WebSocket connection. */
                sendAudioChunk: (chunk: Buffer) => {
                    if (chunk && chunk.length > 0) {
                        try {
                            connectionService.sendAudio(chunk);
                        } catch (sendError: any) {
                            this.logger.error(`Error sending audio chunk during session: ${sendError.message}`);
                            // How to propagate this error back? Maybe emit an event or reject the main promise?
                            // For now, just log it. The EventHandler might catch a resulting WS error.
                        }
                    }
                },
                /** Signals that all audio has been sent and gracefully closes the connection. */
                finishStreaming: async () => {
                    this.logger.log('Signaling end of audio stream to AssemblyAI.');
                    await connectionService.close(true); // Wait for session termination
                },
                /** Returns the promise that resolves with the full transcript or rejects on error. */
                getCompletionPromise: () => {
                    return eventHandler.getCompletionPromise();
                },
            };
        } catch (error: any) {
            this.logger.error(`${chalk.red('Failed to start transcription session:')} ${error.message}`);
            // Ensure connection is cleaned up if setup fails
            await connectionService.close(false).catch(closeErr => this.logger.error(`Error closing WS during session setup failure: ${closeErr.message}`));
            throw error; // Re-throw the error
        }
    }
}
