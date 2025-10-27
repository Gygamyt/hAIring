import { z } from 'zod';

/**
 * Zod schema for the extracted topics.
 * Matches the Python agent's expected JSON output format.
 */
export const ExtractedTopicsSchema = z.object({
    topics: z.array(z.string()).min(1, 'Topics array cannot be empty'),
});

/**
 * TypeScript type inferred from the schema.
 */
export type TopicExtractorOutput = z.infer<typeof ExtractedTopicsSchema>;
