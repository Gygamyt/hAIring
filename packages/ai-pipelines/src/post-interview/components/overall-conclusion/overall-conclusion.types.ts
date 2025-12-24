import { z } from 'zod';

/**
 * Defines the structured output for the OverallConclusion subgraph.
 * This DTO provides the final hiring recommendation and justification,
 * based on synthesizing all previous analysis (CV, technical, values, etc.).
 */
export const OverallConclusionOutputSchema = z.object({
    recommendation: z
        .enum(['Strong Hire', 'Hire', 'No Hire', 'Consider'])
        .describe('The final, definitive hiring recommendation.'),

    finalJustification: z
        .string()
        .describe(
            'A detailed, evidence-based justification for the recommendation. This summary MUST synthesize findings from all inputs. It should explicitly compare the CV (what was claimed) with the interview performance (what was demonstrated).',
        ),

    keyPositives: z
        .array(z.string())
        .describe(
            'A bullet-point list of the most significant positive factors driving this decision (e.g., "Excellent problem-solving", "Strong values fit").',
        ),

    keyConcerns: z
        .array(z.string())
        .describe(
            'A bullet-point list of the most significant red flags or concerns (e.g., "CV experience seems inflated compared to technical answers", "Poor communication").',
        ),
});

export type OverallConclusionOutput = z.infer<typeof OverallConclusionOutputSchema>;
