import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../../utils';
import { TechnicalAssessmentOutput } from './technical-assessment.types';

/**
 * The LangGraph SCHEMA DEFINITION for the TechnicalAssessment subgraph.
 */
export const TechnicalAssessmentStateAnnotation = Annotation.Root({
    // --- Input ---
    /**
     * The raw text content of the interview transcript.
     */
    transcript: Annotation<string>(),
    /**
     * The list of key topics extracted from the transcript.
     * This helps the AI focus on relevant sections.
     */
    topics: Annotation<string[]>(),

    // --- Internal ---
    /**
     * The raw string output from the LLM, before validation.
     */
    rawTechnicalAssessment: Annotation<string | null>(),
    /**
     * A unique ID to trace this run through the logs.
     */
    traceId: Annotation<string | null>(),

    // --- Output ---
    /**
     * The final, validated structured DTO.
     */
    parsedTechnicalAssessment: Annotation<TechnicalAssessmentOutput | null>(),

    // --- Error Handling ---
    validationError: Annotation<string | null>(),
    retries: Annotation<number>(),
});

/**
 * The TypeScript data type for the TechnicalAssessment subgraph's state.
 */
export type ITechnicalAssessmentState = InferGraphState<
    typeof TechnicalAssessmentStateAnnotation
>;