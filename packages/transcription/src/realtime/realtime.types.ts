import { RealtimeTranscriber, StreamingTranscriber } from 'assemblyai';

export interface IRealtimeEventHandler {
    setupEventHandlers(transcriber: StreamingTranscriber): void;
    getFullTranscript(): string;
    getCompletionPromise(): Promise<string>;
}

export interface IRealtimeConnectionService {
    connect(): Promise<{ sessionId: string }>;
    sendAudio(chunk: Buffer): void;
    close(waitForSessionTermination?: boolean): Promise<void>;
    getTranscriberInstance(): StreamingTranscriber | null;
}

export type TranscriptionResult = {
    success: true;
    text: string;
} | {
    success: false;
    error: string;
};
