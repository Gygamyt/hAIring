import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { validateAndParseEnv } from "@hairing/utils/src/config.util";

const AiConfigSchema = z.object({
    GOOGLE_API_KEY: z.string().min(1, 'GOOGLE_API_KEY is required and cannot be empty.'),
    GEMINI_MODEL_NAME: z.string().default('gemini-pro'),
    GEMINI_TEMPERATURE: z
        .string()
        .transform((val) => parseFloat(val))
        .default('0.7'),
    GEMINI_TOP_P: z
        .string()
        .transform((val) => parseFloat(val))
        .default('1'),
});

export type AiConfig = {
    apiKey: string;
    model: string;
    temperature: number;
    topP: number;
};

export default registerAs('ai', (): AiConfig => {
    const validatedEnv = validateAndParseEnv(AiConfigSchema, process.env);
    return {
        apiKey: validatedEnv.GOOGLE_API_KEY,
        model: validatedEnv.GEMINI_MODEL_NAME,
        temperature: validatedEnv.GEMINI_TEMPERATURE,
        topP: validatedEnv.GEMINI_TEMPERATURE,
    };
});
