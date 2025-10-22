import { z } from 'zod';

/**
 * Defines the structured output for the TechnicalAssessment subgraph.
 * This DTO captures the analysis of the candidate's technical skills
 * based on their answers in the interview transcript.
 */
export const TechnicalAssessmentOutputSchema = z.object({
    overallScore: z
        .number()
        .min(1)
        .max(10)
        .describe(
            'Overall technical skill score from 1 (Poor) to 10 (Excellent), based on the transcript.',
        ),

    knowledgeDepth: z
        .enum(['superficial', 'moderate', 'deep'])
        .describe(
            'Assessment of the depth of theoretical knowledge demonstrated.',
        ),

    practicalExperience: z
        .enum(['lacking', 'mentioned', 'demonstrated'])
        .describe(
            'Assessment of practical, hands-on experience (e.g., "I did..." vs "One could...").',
        ),

    problemSolving: z
        .enum(['weak', 'average', 'strong'])
        .describe(
            'Assessment of the candidate\'s problem-solving skills, if applicable.',
        ),

    summary: z
        .string()
        .describe(
            'A detailed summary of technical skills, highlighting specific strengths (e.g., "Good answer on microservices") and weaknesses ("Struggled with databases") with examples.',
        ),
});

export type TechnicalAssessmentOutput = z.infer<
    typeof TechnicalAssessmentOutputSchema
>;
