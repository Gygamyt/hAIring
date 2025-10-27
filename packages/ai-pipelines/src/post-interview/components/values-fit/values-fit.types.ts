import { z } from 'zod';

/**
 * Defines the structured output for the ValuesFit subgraph.
 * This DTO captures the analysis of the candidate's alignment
 * with company values, based on the interview transcript.
 */
export const ValuesFitOutputSchema = z.object({
    overallSummary: z
        .string()
        .describe(
            'A high-level summary of the candidate\'s alignment with the provided company values.',
        ),

    assessedValues: z.array(
        z.object({
            value: z.string().describe('The specific company value being assessed.'),
            match: z
                .enum(['high', 'medium', 'low', 'not_discussed'])
                .describe(
                    'The level of alignment or cognitive resonance the candidate demonstrated for this value.',
                ),
            evidence: z
                .string()
                .describe(
                    'Specific examples, direct quotes, or behavioral evidence from the transcript to support the assessment.',
                ),
        }),
    ).describe('A detailed breakdown of the assessment for each company value.'),
});

export type ValuesFitOutput = z.infer<typeof ValuesFitOutputSchema>;
