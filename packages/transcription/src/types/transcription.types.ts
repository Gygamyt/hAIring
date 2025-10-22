import { TranscriptWord } from "assemblyai";

export interface TranscriptionOptions {
    languageDetection?: boolean;
    languageCode?: string; // e.g., 'en_us', 'ru'
    // languageConfidenceThreshold?: number; // Only used with languageDetection=true
    punctuate?: boolean;
    formatText?: boolean;
    speakerLabels?: boolean; // Added for speaker diarization
    speakersExpected?: number; // Added for speaker diarization
    // Add other AssemblyAI features as needed
    // sentimentAnalysis?: boolean;
    // autoChapters?: boolean;
    // summarization?: boolean;
    // summaryModel?: 'informative' | 'conversational' | 'catchy';
    // summaryType?: 'paragraph' | 'bullets' | 'bullets_verbose' | 'gist' | 'headline';
}

export interface TranscriptionResult {
    text: string | null; // Text can be null if transcription fails or yields no content
    detectedLanguage?: string | null;
    // languageConfidence?: number | null; // Confidence often not returned unless detection enabled
    audioId: string; // AssemblyAI transcript ID
    words: TranscriptWord[] | null; // Word timings/speakers
    utterances?: any[] | null; // Speaker labels result
    // Add other potential results
    // sentimentAnalysisResults?: any[] | null;
    // chapters?: any[] | null;
    // summary?: string | null;
}
