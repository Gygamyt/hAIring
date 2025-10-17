import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { validateAndParseEnv } from "@hairing/utils/src/config.util";

const TranscriptionConfigSchema = z.object({
    ASSEMBLYAI_API_KEY: z.string().min(1, 'ASSEMBLYAI_API_KEY is required.'),
});

export type TranscriptionConfig = {
    assemblyAiApiKey: string;
};

export default registerAs('transcription', (): TranscriptionConfig => {
    const env = validateAndParseEnv(TranscriptionConfigSchema, process.env);
    return {
        assemblyAiApiKey: env.ASSEMBLYAI_API_KEY,
    };
});
