import { registerAs } from "@nestjs/config";

export const transcriptionConfig = registerAs('transcription', () => {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
        throw new Error('ASSEMBLYAI_API_KEY is not set in .env');
    }

    return {
        apiKey,
    };
});
