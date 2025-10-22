import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../../utils';
import { CandidateInfoSummaryOutput } from "./candidate-info-summary.types";

/**
 * The LangGraph SCHEMA DEFINITION for the CandidateInfoSummary subgraph.
 */
export const CandidateInfoSummaryStateAnnotation = Annotation.Root({
    // --- Input ---
    cvText: Annotation<string>(),

    // --- Internal ---
    /**
     * The raw string output from the LLM, before validation.
     */
    rawCvSummary: Annotation<string | null>(),
    /**
     * A unique ID to trace this run through the logs.
     */
    traceId: Annotation<string | null>(),

    // --- Output ---
    /**
     * The final, validated structured DTO.
     */
    parsedCv: Annotation<CandidateInfoSummaryOutput | null>(),

    // --- Error Handling ---
    validationError: Annotation<string | null>(),
    retries: Annotation<number>(),
});

/**
 * The TypeScript data type for the CandidateInfoSummary subgraph's state.
 */
export type ICandidateInfoSummaryState = InferGraphState<
    typeof CandidateInfoSummaryStateAnnotation
>;
