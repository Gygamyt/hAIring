import { Annotation } from '@langchain/langgraph';
import type {
    AggregatedData,
    CvData,
    FeedbackData,
    RequirementsData,
} from './parsing/parsing.state';
import type {
    CriteriaMatching,
    GradeAndType,
    ValuesAssessment,
    FinalResult,
} from './grading';
import type {
    Report,
    Summary,
    Recommendations,
    InterviewTopics,
} from './reporting';
import { InferGraphState } from "../utils";

/**
 * The LangGraph SCHEMA DEFINITION for the entire candidate pipeline.
 * It combines all channels from the subgraphs into a single, unified state.
 */
export const CandidatePipelineSchema = Annotation.Root({
    traceId: Annotation<string>(),

    // --- Initial Inputs (from parsing) ---
    cvText: Annotation<string>(),
    requirementsText: Annotation<string>(),
    feedbackText: Annotation<string>(),

    // --- Parsing Subgraph Outputs ---
    parsedCv: Annotation<CvData>(),
    parsedRequirements: Annotation<RequirementsData>(),
    parsedFeedback: Annotation<FeedbackData>(),
    aggregatedResult: Annotation<AggregatedData>(),

    // --- Grading Subgraph Outputs ---
    gradeAndType: Annotation<GradeAndType>(),
    criteriaMatching: Annotation<CriteriaMatching>(),
    valuesAssessment: Annotation<ValuesAssessment>(),
    finalResult: Annotation<FinalResult>(),

    // --- Reporting Subgraph Outputs ---
    summary: Annotation<Summary>(),
    recommendations: Annotation<Recommendations>(),
    interviewTopics: Annotation<InterviewTopics>(),
    report: Annotation<Report>(),
});

/**
 * The TypeScript DATA TYPE for the entire pipeline's state.
 */
export type CandidatePipelineState = InferGraphState<typeof CandidatePipelineSchema>;
