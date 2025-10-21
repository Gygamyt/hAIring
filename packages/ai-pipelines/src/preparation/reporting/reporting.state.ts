import { Annotation } from "@langchain/langgraph";
import { FinalResult } from "../grading";
import { InferGraphState } from "../../utils";
import type {
    Summary,
    Recommendations,
    InterviewTopics,
    Report
} from "./reporting.types";


/**
 * The LangGraph SCHEMA DEFINITION for the reporting graph.
 */
export const ReportingGraphStateAnnotation = Annotation.Root({
    traceId: Annotation<string | null>(),

    // --- Input from grading ---
    finalResult: Annotation<FinalResult | null>(),

    // --- Outputs ---
    summary: Annotation<Summary | null>(),
    recommendations: Annotation<Recommendations | null>(),
    interviewTopics: Annotation<InterviewTopics | null>(),
    report: Annotation<Report | null>(),

    // --- NEW: Summary Retry Loop ---
    rawSummary: Annotation<string | null>(),
    summaryError: Annotation<string | null>(),
    summaryRetries: Annotation<number | null>(),

    // --- NEW: Recommendations Retry Loop ---
    rawRecommendations: Annotation<string | null>(),
    recommendationsError: Annotation<string | null>(),
    recommendationsRetries: Annotation<number | null>(),

    // --- NEW: Topics Retry Loop ---
    rawTopics: Annotation<string | null>(),
    topicsError: Annotation<string | null>(),
    topicsRetries: Annotation<number | null>(),

    // --- NEW: Global Error ---
    graphError: Annotation<string | null>(),
});

/**
 * The TypeScript DATA TYPE for the reporting graph's state.
 */
export type ReportingGraphState = InferGraphState<typeof ReportingGraphStateAnnotation>;
