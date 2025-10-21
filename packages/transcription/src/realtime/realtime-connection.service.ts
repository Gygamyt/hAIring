// packages/transcription/src/realtime/realtime-connection.service.ts
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { AssemblyAI, StreamingTranscriber, BeginEvent } from 'assemblyai';
import chalk from 'chalk';
import { IRealtimeConnectionService } from './realtime.types';
import { ASSEMBLYAI_CLIENT } from "../constants";

const CONNECTION_TIMEOUT_MS = 15000; // 15 seconds

@Injectable({ scope: Scope.TRANSIENT })
export class RealtimeConnectionService implements IRealtimeConnectionService {
    private readonly logger = new Logger(RealtimeConnectionService.name);
    private transcriber: StreamingTranscriber | null = null;
    private connectionPromise: Promise<{ sessionId: string }> | null = null;
    private isConnected = false;
    private connectionTimeoutId: NodeJS.Timeout | null = null;
    private currentSessionId: string | null = null;

    constructor(@Inject(ASSEMBLYAI_CLIENT) private client: AssemblyAI) {}

    /**
     * Establishes a WebSocket connection using client.streaming.transcriber.
     * Manages connection state and timeout.
     * @returns A promise resolving with the session ID upon successful connection.
     */
    connect(): Promise<{ sessionId: string }> {
        // Prevent multiple simultaneous connection attempts
        if (this.connectionPromise) {
            this.logger.warn('Connection attempt already in progress.');
            return this.connectionPromise;
        }
        if (this.isConnected) {
            this.logger.warn('Connect called, but already connected.');
            return Promise.resolve({ sessionId: this.currentSessionId || 'already_connected' });
        }

        this.logger.log(`Attempting connection via client.streaming.transcriber (Timeout: ${CONNECTION_TIMEOUT_MS / 1000}s)...`);

        try {
            // Instantiate the transcriber
            this.transcriber = this.client.streaming.transcriber({
                sampleRate: 16000
            });
        } catch (instantiationError: any) {
            this.logger.error(`Failed to instantiate streaming transcriber: ${instantiationError.message}`);
            return Promise.reject(new Error(`Failed to instantiate streaming transcriber: ${instantiationError.message}`));
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            // Centralized rejection handler to ensure cleanup
            const handleRejection = (error: Error) => {
                if (this.connectionTimeoutId) clearTimeout(this.connectionTimeoutId);
                this.connectionTimeoutId = null;
                // Only reject if the promise hasn't already resolved/rejected
                if (this.connectionPromise) { // Check if promise still pending
                    reject(error);
                }
                this.cleanupConnection(); // Ensure cleanup happens
            };

            // Setup connection timeout
            this.connectionTimeoutId = setTimeout(() => {
                this.logger.error(`${chalk.red('[Streaming WebSocket CONNECT TIMEOUT]')} after ${CONNECTION_TIMEOUT_MS / 1000}s.`);
                handleRejection(new Error(`Streaming WebSocket connection timed out after ${CONNECTION_TIMEOUT_MS / 1000}s.`));
            }, CONNECTION_TIMEOUT_MS);

            // --- Event Handlers ---
            this.transcriber!.on('open', (beginEvent: BeginEvent) => {
                if (this.connectionTimeoutId) clearTimeout(this.connectionTimeoutId);
                this.connectionTimeoutId = null;

                // Check if connection already handled (e.g., by timeout/error)
                if (this.isConnected || !this.connectionPromise) {
                    this.logger.warn(`'open' event received, but connection state is unexpected (isConnected: ${this.isConnected}). Ignoring.`);
                    return;
                }

                this.isConnected = true;
                // Correct property is session_id based on SDK
                this.currentSessionId = beginEvent.id;
                this.logger.log(`${chalk.greenBright('[Streaming WebSocket OPEN CONFIRMED]')} Session ID: ${this.currentSessionId}`);
                resolve({ sessionId: this.currentSessionId });
                // Do not clear connectionPromise here, let subsequent calls check isConnected
            });

            this.transcriber!.on('error', (error: Error) => {
                // This handles errors *during* or *after* connection attempt
                this.logger.error(`${chalk.red(this.isConnected ? '[Streaming WebSocket RUNTIME ERROR]' : '[Streaming WebSocket CONNECT ERROR]')}`, error.message);
                handleRejection(new Error(`Streaming WebSocket error: ${error.message}`));
            });

            this.transcriber!.on('close', (code: number, reason: string) => {
                // Handles unexpected close *before* 'open' or expected close *after* operation
                if (!this.isConnected) { // Closed before 'open' was received
                    this.logger.error(`${chalk.red('[Streaming WebSocket CLOSED BEFORE OPEN]')} Code: ${code}, Reason: ${reason}`);
                    handleRejection(new Error(`Streaming WebSocket closed before opening. Code: ${code}, Reason: ${reason}`));
                } else {
                    // If closed *after* connection, log it but let EventHandler manage promise resolution/rejection
                    this.logger.log(`${chalk.yellow('[Streaming WebSocket CLOSED NORMALLY/RUNTIME]')} Code: ${code}, Reason: ${reason}`);
                    // Ensure state is cleaned up if EventHandler doesn't handle it (e.g., abrupt close)
                    this.cleanupConnection();
                }
            });
        });

        // Initiate the connection after setting up listeners
        try {
            this.logger.log('Calling transcriber.connect()...');
            this.transcriber.connect();
        } catch (connectError: any) {
            this.logger.error(`Error calling transcriber.connect(): ${connectError.message}`);
            this.cleanupConnection(); // Clean up if connect call itself fails
            return Promise.reject(new Error(`Error initiating connection: ${connectError.message}`));
        }

        return this.connectionPromise;
    }

    /** Cleans up internal state and potentially the transcriber */
    private cleanupConnection(): void {
        this.logger.log('Cleaning up WebSocket connection state...');
        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
            this.connectionTimeoutId = null;
        }

        this.transcriber = null;
        this.isConnected = false;
        this.connectionPromise = null;
        this.currentSessionId = null;
    }

    /** Sends audio data if connected */
    sendAudio(chunk: Buffer): void {
        if (!this.transcriber || !this.isConnected) {
            this.logger.error('Attempted to send audio when connection not established or closed.');
            throw new Error('Streaming WebSocket connection not open. Cannot send audio.');
        }
        try {
            this.transcriber.sendAudio(chunk.buffer);
        } catch (e: any) {
            this.logger.error(`Error during transcriber.sendAudio: ${e.message}. Connection state: ${this.isConnected}`);
            throw new Error(`Failed to send audio chunk: ${e.message}`);
        }
    }

    /** Gracefully closes the WebSocket connection */
    async close(waitForSessionTermination = true): Promise<void> {
        const transcriberToClose = this.transcriber;

        if (transcriberToClose) {
            this.logger.log(`Attempting to close streaming WebSocket connection (wait: ${waitForSessionTermination})...`);
            try {
                await transcriberToClose.close(waitForSessionTermination);
                this.logger.log(`${chalk.yellow('[Streaming WebSocket CLOSED BY CLIENT]')}`);
            } catch (error: any) {
                this.logger.error(`Error during explicit WebSocket close(): ${error.message}`);
            } finally {
                this.cleanupConnection();
            }
        } else {
            this.logger.warn('Close called, but no active connection or transcriber instance exists.');
            // Ensure state reflects closure if called redundantly
            this.cleanupConnection();
        }
    }

    /** Returns the current transcriber instance */
    getTranscriberInstance(): StreamingTranscriber | null {
        return this.transcriber;
    }
}
