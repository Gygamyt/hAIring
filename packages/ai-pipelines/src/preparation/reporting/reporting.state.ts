import z from "zod";
import { Annotation } from "@langchain/langgraph";
import { FinalResult } from "../grading";
import { InferGraphState } from "../../utils";

/**
 * Schema for the summary node's output.
 */
export const SummarySchema = z.object({
    summary: z.string(),
});

/**
 * Schema for the recommendations node's output.
 */
export const RecommendationsSchema = z.object({
    recommendations: z.string(),
});

/**
 * Schema for the interview topics node's output.
 */
export const InterviewTopicsSchema = z.object({
    interview_topics: z.array(z.string()),
});

/**
 * Schema for the final, comprehensive report object.
 */
export const ReportSchema = z.object({
    first_name: z.string(),
    last_name: z.string(),
    matching_table: z.array(z.object({
        criterion: z.string(),
        match: z.enum(['full', 'partial', 'none']),
        comment: z.string(),
    })),
    candidate_profile: z.string(),
    conclusion: z.object({
        summary: z.string(),
        recommendations: z.string(),
        interview_topics: z.array(z.string()),
        values_assessment: z.string(),
    }),
});

export type Summary = z.infer<typeof SummarySchema>;
export type Recommendations = z.infer<typeof RecommendationsSchema>;
export type InterviewTopics = z.infer<typeof InterviewTopicsSchema>;
export type Report = z.infer<typeof ReportSchema>;

/**
 * The LangGraph SCHEMA DEFINITION for the reporting graph.
 */
export const ReportingGraphStateAnnotation = Annotation.Root({
    finalResult: Annotation<FinalResult>(),
    summary: Annotation<Summary>(),
    recommendations: Annotation<Recommendations>(),
    interviewTopics: Annotation<InterviewTopics>(),
    report: Annotation<Report>(),
});

/**
 * The TypeScript DATA TYPE for the reporting graph's state.
 */
export type ReportingGraphState = InferGraphState<typeof ReportingGraphStateAnnotation>;
