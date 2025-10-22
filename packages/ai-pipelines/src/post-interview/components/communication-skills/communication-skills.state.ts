import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../../utils';
import { CommunicationSkillsOutput } from "./communication-skills.types";

/**
 * The LangGraph SCHEMA DEFINITION for the CommunicationSkills subgraph.
 */
export const CommunicationSkillsStateAnnotation = Annotation.Root({
    // --- Input ---
    /**
     * The raw text content of the interview transcript.
     */
    transcript: Annotation<string>(),

    // --- Internal ---
    /**
     * The raw string output from the LLM, before validation.
     */
    rawCommunicationSkills: Annotation<string | null>(),
    /**
     * A unique ID to trace this run through the logs.
     */
    traceId: Annotation<string | null>(),

    // --- Output ---
    /**
     * The final, validated structured DTO.
     */
    parsedCommunicationSkills: Annotation<CommunicationSkillsOutput | null>(),

    // --- Error Handling ---
    validationError: Annotation<string | null>(),
    retries: Annotation<number>(),
});

/**
 * The TypeScript data type for the CommunicationSkills subgraph's state.
 */
export type ICommunicationSkillsState = InferGraphState<typeof CommunicationSkillsStateAnnotation>;
