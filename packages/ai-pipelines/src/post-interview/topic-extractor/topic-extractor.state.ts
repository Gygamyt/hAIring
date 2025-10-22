import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../utils';
import type { ExtractedTopics } from './topic-extractor.types';

/**
 * LangGraph SCHEMA definition for the Topic Extractor subgraph.
 */
export const TopicExtractorStateAnnotation = Annotation.Root({
    // --- Input ---
    /** Full text transcript of the interview */
    transcriptionText: Annotation<string | null>(),

    // --- Output ---
    /** Structured list of extracted topics */
    extractedTopics: Annotation<ExtractedTopics | null>(),

    // --- Internal Retry Logic ---
    /** Raw JSON output from the LLM */
    rawTopics: Annotation<string | null>(),
    /** Validation error message for the LLM fixer */
    topicsError: Annotation<string | null>(),
    /** Counter for retry attempts */
    topicsRetries: Annotation<number | null>(),

    // --- Global State Passthrough ---
    /** Trace ID for logging */
    traceId: Annotation<string | null>(),
    /** Global error indicator */
    graphError: Annotation<string | null>(),
});

/**
 * TypeScript DATA TYPE for the subgraph's state.
 */
export type TopicExtractorState = InferGraphState<typeof TopicExtractorStateAnnotation>;
