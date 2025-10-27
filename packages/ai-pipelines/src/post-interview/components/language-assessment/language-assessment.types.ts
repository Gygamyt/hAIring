import { z } from 'zod';

/**
 * Schema for a successful language assessment.
 */
const AssessmentResultSchema = z.object({
    assessmentSkipped: z.literal(false),
    overallLevel: z
        .enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'])
        .describe('The candidate\'s estimated CEFR level.'),
    fluency: z
        .enum(['choppy', 'moderate', 'fluent'])
        .describe('The fluency and flow of speech.'),
    vocabulary: z
        .enum(['basic', 'intermediate', 'advanced'])
        .describe('The range and appropriateness of vocabulary used.'),
    pronunciation: z
        .enum(['heavy_accent', 'understandable', 'clear'])
        .describe('Clarity of pronunciation and accent.'),
    summary: z
        .string()
        .describe(
            'A summary of the language assessment, citing specific examples of strengths or weaknesses (e.g., "Correctly used X idiom", "Struggled with Y tense").',
        ),
});

/**
 * Schema for when the assessment is skipped (e.g., no English spoken).
 */
const SkippedAssessmentSchema = z.object({
    assessmentSkipped: z.literal(true),
    reason: z
        .string()
        .describe('The reason why the assessment was skipped (e.g., "No English spoken in the transcript").'),
});

/**
 * Defines the structured output for the LanguageAssessment subgraph.
 * The output is *either* a full assessment OR a "skipped" notification.
 */
export const LanguageAssessmentOutputSchema = z.union([
    AssessmentResultSchema,
    SkippedAssessmentSchema,
]);

export type LanguageAssessmentOutput = z.infer<
    typeof LanguageAssessmentOutputSchema
>;
