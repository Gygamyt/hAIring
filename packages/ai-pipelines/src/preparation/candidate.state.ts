import { Annotation } from '@langchain/langgraph';
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
import { AggregatedData, CvData, FeedbackData, RequirementsData } from "./parsing/parsing.types";

/**
 * The LangGraph SCHEMA DEFINITION for the entire candidate pipeline.
 * It combines all channels from the subgraphs into a single, unified state.
 */
export const CandidatePipelineSchema = Annotation.Root({
    traceId: Annotation<string | null>(),
    graphError: Annotation<string | null>(),

    // --- 1. Initial Inputs ---
    cvText: Annotation<string | null>(),
    requirementsText: Annotation<string | null>(),
    feedbackText: Annotation<string | null>(),

    // --- 2. Parsing Subgraph State ---
    // Outputs
    parsedCv: Annotation<CvData | null>(),
    parsedRequirements: Annotation<RequirementsData | null>(),
    parsedFeedback: Annotation<FeedbackData | null>(),
    aggregatedResult: Annotation<AggregatedData | null>(),
    // Internal (for retries)
    rawCv: Annotation<string | null>(),
    cvError: Annotation<string | null>(),
    cvRetries: Annotation<number | null>(),
    rawRequirements: Annotation<string | null>(),
    requirementsError: Annotation<string | null>(),
    requirementsRetries: Annotation<number | null>(),
    rawFeedback: Annotation<string | null>(),
    feedbackError: Annotation<string | null>(),
    feedbackRetries: Annotation<number | null>(),

    // --- 3. Grading Subgraph State ---
    // Outputs
    gradeAndType: Annotation<GradeAndType | null>(),
    criteriaMatching: Annotation<CriteriaMatching | null>(),
    valuesAssessment: Annotation<ValuesAssessment | null>(),
    finalResult: Annotation<FinalResult | null>(),
    // Internal (for retries)
    rawGradeAndType: Annotation<string | null>(),
    gradeAndTypeError: Annotation<string | null>(),
    gradeAndTypeRetries: Annotation<number | null>(),
    rawCriteriaMatching: Annotation<string | null>(),
    criteriaMatchingError: Annotation<string | null>(),
    criteriaMatchingRetries: Annotation<number | null>(),
    rawValuesAssessment: Annotation<string | null>(),
    valuesAssessmentError: Annotation<string | null>(),
    valuesAssessmentRetries: Annotation<number | null>(),

    // --- 4. Reporting Subgraph State ---
    // Outputs
    summary: Annotation<Summary | null>(),
    recommendations: Annotation<Recommendations | null>(),
    interviewTopics: Annotation<InterviewTopics | null>(),
    report: Annotation<Report | null>(),
    // Internal (for retries)
    rawSummary: Annotation<string | null>(),
    summaryError: Annotation<string | null>(),
    summaryRetries: Annotation<number | null>(),
    rawRecommendations: Annotation<string | null>(),
    recommendationsError: Annotation<string | null>(),
    recommendationsRetries: Annotation<number | null>(),
    rawInterviewTopics: Annotation<string | null>(),
    topicsError: Annotation<string | null>(),
    topicsRetries: Annotation<number | null>(),
});

/**
 * The TypeScript DATA TYPE for the entire pipeline's state.
 */
export type CandidatePipelineState = InferGraphState<typeof CandidatePipelineSchema>;
