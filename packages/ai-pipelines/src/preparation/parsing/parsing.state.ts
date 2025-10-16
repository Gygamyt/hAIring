import { Annotation } from '@langchain/langgraph';
import { z } from 'zod';
import { InferGraphState } from "../../utils";

/**
 * Defines the schema for structured data extracted from a CV.
 */
export const CvDataSchema = z.object({
    first_name: z.string(),
    last_name: z.string(),
    skills: z.array(z.string()),
    experience: z.string(),
});

/**
 * Defines the schema for structured data extracted from job requirements.
 */
export const RequirementsDataSchema = z.object({
    hard_skills_required: z.array(z.string()),
    soft_skills_required: z.array(z.string()),
});

/**
 * Defines the schema for structured data extracted from recruiter feedback.
 */
export const FeedbackDataSchema = z.object({
    comments: z.string(),
});

/**
 * Defines the schema for the final aggregated data structure,
 * combining results from all parsers.
 */
export const AggregatedDataSchema = z.object({
    candidate_info: CvDataSchema,
    job_requirements: RequirementsDataSchema,
    recruiter_feedback: FeedbackDataSchema,
});

export type CvData = z.infer<typeof CvDataSchema>;
export type RequirementsData = z.infer<typeof RequirementsDataSchema>;
export type FeedbackData = z.infer<typeof FeedbackDataSchema>;
export type AggregatedData = z.infer<typeof AggregatedDataSchema>;

/**
 * Defines the complete state for the parsing graph using LangGraph's Annotation API.
 * This centralized definition ensures type safety across all nodes.
 */
export const PreparationGraphStateAnnotation = Annotation.Root({
    // --- Initial Inputs ---
    cvText: Annotation<string>(),
    requirementsText: Annotation<string>(),
    feedbackText: Annotation<string>(),

    // --- Parsed Data from Parallel Nodes ---
    parsedCv: Annotation<CvData>(),
    parsedRequirements: Annotation<RequirementsData>(),
    parsedFeedback: Annotation<FeedbackData>(),

    // --- Final Aggregated Output ---
    aggregatedResult: Annotation<AggregatedData>(),
});

/**
 * The compiled TypeScript type for the graph's state.
 */
export type PreparationGraphState = InferGraphState<typeof PreparationGraphStateAnnotation>;
