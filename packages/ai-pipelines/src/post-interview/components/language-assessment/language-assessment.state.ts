import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../../utils';
import { LanguageAssessmentOutput } from "./language-assessment.types";


/**
 * The LangGraph SCHEMA DEFINITION for the LanguageAssessment subgraph.
 */
export const LanguageAssessmentStateAnnotation = Annotation.Root({
    // --- Input ---
    /**
     * The raw text content of the interview transcript.
     */
    transcript: Annotation<string>(),

    // --- Internal ---
    /**
     * The raw string output from the LLM, before validation.
     */
    rawLanguageAssessment: Annotation<string | null>(),
    /**
     * A unique ID to trace this run through the logs.
     */
    langTraceId: Annotation<string | null>(),

    // --- Output ---
    /**
     * The final, validated structured DTO.
     * Can be either the assessment or the skipped object.
     */
    parsedLanguageAssessment: Annotation<LanguageAssessmentOutput | null>(),

    // --- Error Handling ---
    langValidationError: Annotation<string | null>(),
    langRetries: Annotation<number>(),
});

/**
 * The TypeScript data type for the LanguageAssessment subgraph's state.
 */
export type ILanguageAssessmentState = InferGraphState<typeof LanguageAssessmentStateAnnotation>;