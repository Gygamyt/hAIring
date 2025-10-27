import { z } from 'zod';

const TopicAssessmentDetailSchema = z.object({
    topic: z.string().describe('The name of the topic being assessed.'),
    grade: z
        .enum(['Excellent', 'Good', 'Moderate', 'Weak', 'Not Assessed'])
        .describe("The candidate's grade for this specific topic."),
    summary: z
        .string()
        .describe('Brief justification for the grade for this topic.'),
});

/**
 * Defines the structured output for the TechnicalAssessment subgraph.
 */
export const TechnicalAssessmentOutputSchema = z.object({
    knowledgeDepth: z.enum([
        'very-deep',
        'deep',
        'moderate',
        'superficial',
        'none',
    ]),
    practicalExperience: z.enum(['extensive', 'demonstrated', 'theoretical', 'none']),
    problemSolving: z.enum(['excellent', 'good', 'average', 'weak', 'none']),
    summary: z
        .string()
        .describe(
            'A high-level summary of the candidate\'s overall technical performance.',
        ),

    topicAssessments: z
        .array(TopicAssessmentDetailSchema)
        .describe(
            'An array of assessments for each specific topic provided in the input.',
        ),
});

export type TechnicalAssessmentOutput = z.infer<typeof TechnicalAssessmentOutputSchema>;
