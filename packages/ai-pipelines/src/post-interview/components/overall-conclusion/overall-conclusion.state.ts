import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../../utils';
import { CandidateInfoSummaryOutput } from "../candidate-info-summary";
import { TechnicalAssessmentOutput } from "../technical-assessment";
import { CommunicationSkillsOutput } from "../communication-skills";
import { ValuesFitOutput } from "../values-fit";
import { LanguageAssessmentOutput } from "../language-assessment";
import { AiSummaryOutput } from "../ai-summary";
import { OverallConclusionOutput } from "./overall-conclusion.types";

/**
 * The LangGraph SCHEMA DEFINITION for the OverallConclusion subgraph.
 * This state aggregates all previous analyses to produce a final recommendation.
 */
export const OverallConclusionStateAnnotation = Annotation.Root({
    // --- Input ---
    /**
     * Output from the CV parsing subgraph.
     */
    parsedCv: Annotation<CandidateInfoSummaryOutput | null>(),
    /**
     * Output from the technical assessment subgraph.
     */
    parsedTechnicalAssessment: Annotation<TechnicalAssessmentOutput | null>(),
    /**
     * Output from the communication skills subgraph.
     */
    parsedCommunicationSkills: Annotation<CommunicationSkillsOutput | null>(),
    /**
     * Output from the values fit subgraph.
     */
    parsedValuesFit: Annotation<ValuesFitOutput | null>(),
    /**
     * Output from the language assessment subgraph.
     */
    parsedLanguageAssessment: Annotation<LanguageAssessmentOutput | null>(),
    /**
     * Output from the high-level AI summary subgraph.
     */
    parsedAiSummary: Annotation<AiSummaryOutput | null>(),

    // --- Internal ---
    rawOverallConclusion: Annotation<string | null>(),
    conclusionTraceId: Annotation<string | null>(),

    // --- Output ---
    /**
     * The final, validated structured DTO.
     */
    parsedOverallConclusion: Annotation<OverallConclusionOutput | null>(),

    // --- Error Handling ---
    conclusionValidationError: Annotation<string | null>(),
    conclusionRetries: Annotation<number>(),
});

/**
 * The TypeScript data type for the OverallConclusion subgraph's state.
 */
export type IOverallConclusionState = InferGraphState<typeof OverallConclusionStateAnnotation>;
