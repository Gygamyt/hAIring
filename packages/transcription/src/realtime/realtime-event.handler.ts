// packages/transcription/src/realtime/realtime-event.handler.ts
import { Injectable, Logger, Scope } from '@nestjs/common';
import { RealtimeTranscript, StreamingTranscriber, TurnEvent, RealtimeTranscriptType, StreamingWord } from 'assemblyai';
import chalk from 'chalk';
import { IRealtimeEventHandler } from './realtime.types';

@Injectable({ scope: Scope.TRANSIENT })
export class RealtimeEventHandler implements IRealtimeEventHandler {
    private readonly logger = new Logger(RealtimeEventHandler.name);
    private fullTranscript = '';
    private transcriber: StreamingTranscriber | null = null;
    private resolvePromise!: (value: string) => void;
    private rejectPromise!: (reason?: any) => void;
    private readonly completionPromise: Promise<string>;
    private isClosed = false;
    private lastLoggedLength = 0;

    constructor() {
        this.completionPromise = new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });
    }

    setupEventHandlers(transcriber: StreamingTranscriber): void {
        if (!transcriber) {
            this.logger.error('Cannot set up handlers: Transcriber instance is null.');
            if (!this.isClosed) this.rejectPromise(new Error('Transcriber instance not provided to EventHandler.'));
            this.isClosed = true;
            return;
        }
        this.transcriber = transcriber;
        this.fullTranscript = '';
        this.isClosed = false;
        this.lastLoggedLength = 0;

        this.logger.log('Setting up Streaming WebSocket event handlers...');

        this.transcriber.on('turn', (turnEvent: TurnEvent) => {
            const turnText = turnEvent.words && turnEvent.words.length > 0
                ? turnEvent.words.map((word: StreamingWord) => word.text).join(' ')
                : '';
            this.logger.log(`${chalk.blueBright('[Turn Event DETECTED]')} Order: ${turnEvent.turn_order}, EndOfTurn: ${turnEvent.end_of_turn}, Text: ${turnText ? (turnText.substring(0, 70) + '...') : chalk.dim('None')}`);
            if (turnText) {
                this.fullTranscript += turnText + ' ';
                if (this.fullTranscript.length - this.lastLoggedLength > 1000) {
                    this.logger.log(`${chalk.cyan('[Transcript Progress]')} Accumulated length: ${this.fullTranscript.length} characters.`);
                    this.lastLoggedLength = this.fullTranscript.length;
                }
            } else {
                this.logger.warn(`[Turn Event] Received turn without words/text: Order ${turnEvent.turn_order}, EndOfTurn: ${turnEvent.end_of_turn}`);
            }
        });

        // The 'turn' event might be redundant if 'transcript' with type FinalTranscript works,
        // but we keep it for now based on previous SDK structure. Check AssemblyAI docs for clarification.
        // this.transcriber.on('turn', (turnEvent: TurnEvent) => {
        //     this.logger.log(`${chalk.blueBright('[Turn Event DETECTED]')} Start: ${turnEvent.start_time}, End: ${turnEvent.end_time}, Text: ${turnEvent.text ? (turnEvent.text.substring(0, 70) + '...') : chalk.dim('None')}`);
            // Note: The main 'transcript' handler above (FinalTranscript) is likely sufficient
            // for accumulating text. This 'turn' log helps see utterance boundaries.
            // Avoid adding text here if 'FinalTranscript' works to prevent duplicates.
            // if (turnEvent.text) {
            //    this.fullTranscript += turnEvent.text + ' ';
            // }
        // });

        this.transcriber.on('error', (error: Error) => {
            if (this.isClosed) {
                this.logger.warn(`[Streaming WebSocket Event ERROR] Received error after closed state: ${error.message}`);
                return;
            }
            this.logger.error(`${chalk.red('[Streaming WebSocket Event ERROR]')}`, error.message);
            this.rejectPromise(new Error(`Streaming WebSocket error during transcription: ${error.message}`));
            this.isClosed = true;
        });

        this.transcriber.on('close', (code: number, reason: string) => {
            this.logger.log(`${chalk.bgMagentaBright('[WebSocket Close EVENT RECEIVED]')} Code: ${code}, Reason: ${reason}. Current closed state: ${this.isClosed}`);
            if (this.isClosed) {
                this.logger.warn(`[Streaming WebSocket Event CLOSE] Received close event after closed state. Code: ${code}, Reason: ${reason}`);
                return;
            }
            this.logger.log(`${chalk.yellow('[Streaming WebSocket Event CLOSE]')} Code: ${code}, Reason: ${reason}`);
            this.isClosed = true; // Set flag immediately

            if (code === 1000 || code === 1005) {
                this.logger.log(`Streaming transcription process completed successfully via WebSocket close. Final transcript length: ${this.fullTranscript.trim().length}`);
                this.resolvePromise(this.fullTranscript.trim());
            } else {
                let errMsg = `Streaming WebSocket closed unexpectedly. Code: ${code}, Reason: ${reason}`;
                if (code === 4105 || reason.includes('deprecated')) {
                    errMsg = `Streaming WebSocket closed: Model configuration issue (Code: ${code}, Reason: ${reason}). Check AssemblyAI universal streaming docs.`;
                }
                this.logger.error(errMsg);
                this.rejectPromise(new Error(errMsg));
            }
        });

        this.logger.log('Streaming WebSocket event handlers set up.');
    }

    getFullTranscript(): string {
        return this.fullTranscript.trim();
    }

    getCompletionPromise(): Promise<string> {
        return this.completionPromise;
    }
}
