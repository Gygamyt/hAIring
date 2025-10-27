import { z } from 'zod';

/**
 * Defines the structured output for the AiSummary subgraph.
 * This DTO provides a high-level, narrative summary of the interview,
 * highlighting key strengths and weaknesses.
 */
export const AiSummaryOutputSchema = z.object({
    overallSummary: z
        .string()
        .describe(
            'A narrative summary of the entire interview. Describe the flow of the conversation, the main topics, and the candidate\'s overall demeanor.',
        ),

    keyStrengths: z
        .array(z.string())
        .describe(
            'A bullet-point list of the 3-5 most significant strengths the candidate demonstrated (e.g., "Deep knowledge in X", "Clear communication on Y", "Good problem-solving example for Z").',
        ),

    keyWeaknesses: z
        .array(z.string())
        .describe(
            'A bullet-point list of the 1-3 most significant weaknesses or concerns observed (e.g., "Seemed unsure about Y", "Lacked practical examples in Z", "Avoided question about A").',
        ),
});

export type AiSummaryOutput = z.infer<typeof AiSummaryOutputSchema>;
