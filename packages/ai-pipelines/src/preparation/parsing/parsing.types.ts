import { z } from "zod";

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
