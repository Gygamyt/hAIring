import { z } from 'zod';

/**
 * Defines the structured output for the CandidateInfoSummary subgraph.
 * This DTO captures the raw, factual data extracted directly from the candidate's CV.
 */
export const CandidateInfoSummaryOutputSchema = z.object({
    fullName: z
        .string()
        .describe('The full name of the candidate (e.g., "John Doe").'),
    location: z
        .string()
        .optional()
        .describe('The candidate\'s stated location (e.g., "City, Country").'),
    summary: z
        .string()
        .describe(
            'A concise summary of the candidate (education, key experience) based on the CV.',
        ),
    skills: z
        .array(z.string())
        .describe(
            'A comprehensive list of all skills, technologies, or methodologies explicitly mentioned in the CV.',
        ),
    yearsOfExperience: z
        .coerce
        .number()
        .optional()
        .describe('The approximate total number of years of relevant professional experience.'),
});

export type CandidateInfoSummaryOutput = z.infer<typeof CandidateInfoSummaryOutputSchema>;
