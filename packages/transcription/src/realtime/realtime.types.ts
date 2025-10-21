// packages/transcription/src/realtime/realtime.types.ts
import { RealtimeTranscriber, StreamingTranscriber } from 'assemblyai'; // <-- Import RealtimeTranscriber

// Interface for the object that handles WebSocket events
export interface IRealtimeEventHandler {
    // --- UPDATED SIGNATURE ---
    setupEventHandlers(transcriber: StreamingTranscriber): void; // <-- Add the parameter here
    // --- END UPDATE ---
    getFullTranscript(): string;
    getCompletionPromise(): Promise<string>;
    // Add other methods if needed, e.g., reset()
}

// Interface for the object that manages the WebSocket connection
export interface IRealtimeConnectionService {
    connect(): Promise<{ sessionId: string }>;
    sendAudio(chunk: Buffer): void;
    close(waitForSessionTermination?: boolean): Promise<void>;
    // --- ADDED METHOD ---
    getTranscriberInstance(): StreamingTranscriber | null; // <-- Add this method signature
    // --- END ADDITION ---
}

// Type for the final transcription result or error
export type TranscriptionResult = {
    success: true;
    text: string;
} | {
    success: false;
    error: string;
};
