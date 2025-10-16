// file: src/ai-core/config/ai.config.ts

import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// Define the shape of the AI configuration using Zod for validation
const AiConfigSchema = z.object({
    apiKey: z.string().min(1, 'GOOGLE_API_KEY is required'),
    model: z.string().default('gemini-pro'),
    temperature: z.number().min(0).max(1).default(0.7),
    topP: z.number().min(0).max(1).default(1),
});

// Infer the TypeScript type from the schema
export type AiConfig = z.infer<typeof AiConfigSchema>;

export default registerAs('ai', (): AiConfig => {
    // Parse and validate environment variables
    const config = {
        apiKey: process.env.GOOGLE_API_KEY,
        model: process.env.GEMINI_MODEL_NAME,
        temperature: process.env.GEMINI_TEMPERATURE
            ? parseFloat(process.env.GEMINI_TEMPERATURE)
            : undefined,
        topP: process.env.GEMINI_TOP_P
            ? parseFloat(process.env.GEMINI_TOP_P)
            : undefined,
    };

    // The .parse method will throw an error if validation fails
    return AiConfigSchema.parse(config);
});