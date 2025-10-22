import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../../utils';
import { AiSummaryOutput } from "../overall-conclusion";

/**
 * The LangGraph SCHEMA DEFINITION for the AiSummary subgraph.
 */
export const AiSummaryStateAnnotation = Annotation.Root({
    // --- Input ---
    /**
     * The raw text content of the interview transcript.
     */
    transcript: Annotation<string>(),
    /**
     * The list of key topics extracted from the transcript.
     */
    topics: Annotation<string[]>(),

    // --- Internal ---
    /**
     * The raw string output from the LLM, before validation.
     */
    rawAiSummary: Annotation<string | null>(),
    /**
     * A unique ID to trace this run through the logs.
     */
    traceId: Annotation<string | null>(),

    // --- Output ---
    /**
     * The final, validated structured DTO.
     */
    parsedAiSummary: Annotation<AiSummaryOutput | null>(),

    // --- Error Handling ---
    validationError: Annotation<string | null>(),
    retries: Annotation<number>(),
});

/**
 * The TypeScript data type for the AiSummary subgraph's state.
 */
export type IAiSummaryState = InferGraphState<
    typeof AiSummaryStateAnnotation
>;
