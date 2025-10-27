import { z } from 'zod';

/**
 * Defines the structured output for the CommunicationSkills subgraph.
 * This DTO captures the analysis of the candidate's communication abilities
 * based on the interview transcript.
 */
export const CommunicationSkillsOutputSchema = z.object({
    overallScore: z
        .number()
        .min(1)
        .max(10)
        .describe('Overall communication skill score from 1 (Poor) to 10 (Excellent).'),

    clarity: z
        .enum(['poor', 'average', 'good', 'excellent'])
        .describe('How clear and concise the candidate\'s answers were.'),

    structure: z
        .enum(['unstructured', 'average', 'well-structured'])
        .describe('How well the candidate structured their thoughts and answers (e.g., using STAR).'),

    engagement: z
        .enum(['low', 'medium', 'high'])
        .describe('The candidate\'s level of engagement, proactivity, and interest shown during the interview.'),

    summary: z
        .string()
        .describe('A detailed summary of communication skills, highlighting specific strengths and weaknesses with examples from the transcript.'),
});

export type CommunicationSkillsOutput = z.infer<typeof CommunicationSkillsOutputSchema>;
