import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../../utils';
import { ValuesFitOutput } from "./values-fit.types";

/**
 * The LangGraph SCHEMA DEFINITION for the ValuesFit subgraph.
 */
export const ValuesFitStateAnnotation = Annotation.Root({
    // --- Input ---
    /**
     * The raw text content of the interview transcript.
     */
    transcript: Annotation<string>(),
    /**
     * The company values to assess against.
     * This could be a raw string, a JSON string, or a formatted list.
     */
    companyValues: Annotation<string>(),

    // --- Internal ---
    /**
     * The raw string output from the LLM, before validation.
     */
    rawValuesFit: Annotation<string | null>(),
    /**
     * A unique ID to trace this run through the logs.
     */
    traceId: Annotation<string | null>(),

    // --- Output ---
    /**
     * The final, validated structured DTO.
     */
    parsedValuesFit: Annotation<ValuesFitOutput | null>(),

    // --- Error Handling ---
    validationError: Annotation<string | null>(),
    retries: Annotation<number>(),
});

/**
 * The TypeScript data type for the ValuesFit subgraph's state.
 */
export type IValuesFitState = InferGraphState<
    typeof ValuesFitStateAnnotation
>;
