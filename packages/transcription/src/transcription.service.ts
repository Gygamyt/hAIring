import { Inject, Injectable, Logger } from '@nestjs/common';
import { AssemblyAI, Transcript, TranscriptWord } from 'assemblyai';
import { RealtimeConnectionService } from './realtime/realtime-connection.service';
import { RealtimeEventHandler } from './realtime/realtime-event.handler';
import { ModuleRef } from '@nestjs/core';
import { ASSEMBLYAI_CLIENT } from './constants';
import chalk from 'chalk';

//todo move interfaces

export interface TranscriptionOptions {
    languageDetection?: boolean;
    languageCode?: string;
    languageConfidenceThreshold?: number;
    punctuate?: boolean;
    formatText?: boolean;
}

export interface TranscriptionResult {
    text: string;
    detectedLanguage?: string;
    languageConfidence?: number;
    audioId: string;
    words: TranscriptWord[];
}

@Injectable()
export class TranscriptionService {
    private readonly logger = new Logger(TranscriptionService.name);

    constructor(
        private moduleRef: ModuleRef,
        @Inject(ASSEMBLYAI_CLIENT) private client: AssemblyAI,
    ) {
        this.logger.log('AssemblyAI client injected successfully.');
    }

    async transcribeFile(
        audioSource: string,
        options: TranscriptionOptions = {},
    ): Promise<TranscriptionResult> {
        const {
            languageDetection = true,
            languageCode = 'ru',
            languageConfidenceThreshold = 0.7,
            punctuate = true,
            formatText = true,
        } = options;

        this.logger.log(chalk.blue(`Starting transcription: ${audioSource}`));

        const config: any = { //todo use type
            audio: audioSource,
            punctuate,
            format_text: formatText,
            speaker_labels: true,
            // sentiment_analysis: true,
            // auto_chapters: true,
            // summarization: true,
            // summary_model: "informative",
            // summary_type: "paragraph",
            // multichannel: true,
            speakers_expected: 2,
            speech_model: "best"
        };

        if (languageCode) {
            config.language_code = languageCode;
            this.logger.log(chalk.cyan(`Using auto-detected language: ${languageCode}`));
        } else if (languageDetection) {
            config.language_detection = true;
            config.language_confidence_threshold = languageConfidenceThreshold;
            this.logger.log(
                chalk.cyan(`Auto language detection threshold: ${languageConfidenceThreshold}`),
            );
        }

        const transcript: Transcript = await this.client.transcripts.transcribe(config);

        logTranscriptBySpeakerWithTimestamps(transcript);

        if (transcript.status === 'error') {
            this.logger.error(`Transcription failed: ${transcript.error}`);
            throw new Error(`Transcription error: ${transcript.error}`);
        }

        this.logger.log(chalk.green(`Transcription succeeded, ID: ${transcript.id}`));

        if (transcript.language_code) {
            this.logger.log(chalk.yellow(`Detected language: ${transcript.language_code}`));
        }
        if (transcript.language_confidence !== undefined) {

            this.logger.log(
                chalk.yellow(
                    // @ts-ignore
                    `Language confidence: ${(transcript.language_confidence * 100).toFixed(1)}%`,
                ),
            );
        }

        return {
            text: transcript.text ?? '',
            detectedLanguage: transcript.language_code,
            languageConfidence: transcript.language_confidence as number,
            audioId: transcript.id,
            words: transcript.words ?? []
        };
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
        finishStreaming: () => Promise<void>;
        getCompletionPromise: () => Promise<string>;
    }> {
        this.logger.log('Starting new transcription session setup...');

        const connectionService = await this.moduleRef.create(RealtimeConnectionService);
        const eventHandler = await this.moduleRef.create(RealtimeEventHandler);

        try {
            await connectionService.connect();
            const transcriberInstance = connectionService.getTranscriberInstance();
            if (!transcriberInstance) {
                throw new Error('Failed to get transcriber instance after connect.');
            }

            eventHandler.setupEventHandlers(transcriberInstance);
            this.logger.log('Transcription session setup complete.');

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
            await connectionService.close(false).catch(closeErr => this.logger.error(`Error closing WS during session setup failure: ${closeErr.message}`));
            throw error;
        }
    }
}

//todo move functions

function logTranscriptBySpeakerWithTimestamps(result: Transcript): void {
    if (!result.words || result.words.length === 0) {
        console.log('No word-level data available.');
        return;
    }

    let currentSpeaker = result.words[0].speaker;
    let currentTranscript = '';
    let currentStartTime = result.words[0].start;

    result.words.forEach((word, index) => {
        if (word.speaker !== currentSpeaker) {

            console.log(`Speaker${currentSpeaker}: ${currentTranscript.trim()} | ${formatTimestamp(currentStartTime)}`);

            currentSpeaker = word.speaker;
            currentTranscript = word.text + ' ';
            currentStartTime = word.start;
        } else {
            currentTranscript += word.text + ' ';
        }

        if (index === result.words!.length - 1) {
            console.log(`Speaker${currentSpeaker}: ${currentTranscript.trim()} | ${formatTimestamp(currentStartTime)}`);
        }
    });
}

function formatTimestamp(ms: number): string {
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
    const seconds = (totalSeconds % 60).toFixed(3);
    return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${seconds.padStart(6,'0')}`;
}
