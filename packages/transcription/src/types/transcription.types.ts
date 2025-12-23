import { TranscriptWord } from "assemblyai";

export interface TranscriptionOptions {
    languageDetection?: boolean;
    languageCode?: string;
    languageConfidenceThreshold?: number;
    speechModel?: 'best' | 'nano';

    punctuate?: boolean;
    formatText?: boolean;

    speakerLabels?: boolean;
    speakersExpected?: number;

    keytermsPrompt?: string[];

    summarization?: boolean;
    summaryModel?: 'informative' | 'conversational' | 'catchy';
    summaryType?: 'paragraph' | 'bullets' | 'bullets_verbose' | 'gist' | 'headline';

    sentimentAnalysis?: boolean;
    autoChapters?: boolean;
    entityDetection?: boolean;

    piiRedaction?: boolean;
    piiRedactionPolicy?: string;
    filterProfanity?: boolean;
}

export interface TranscriptionResult {
    audioId: string;
    text: string | null;
    detectedLanguage?: string | null;
    languageConfidence?: number | null;

    words: TranscriptWord[] | null;
    utterances?: any[] | null;

    summary?: string | null;
    chapters?: any[] | null;
    sentimentAnalysisResults?: any[] | null;
    entities?: any[] | null;
}
