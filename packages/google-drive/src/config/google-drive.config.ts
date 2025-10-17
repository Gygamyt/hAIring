import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { validateAndParseEnv } from "@hairing/utils/src";

const GoogleDriveConfigSchema = z.object({
    GOOGLE_APPLICATION_B64: z.string().min(1, 'GOOGLE_APPLICATION_B64 is required.'),
});

export type GoogleDriveConfig = {
    credentialsB64: string;
};

export default registerAs('googledrive', (): GoogleDriveConfig => {
    const env = validateAndParseEnv(GoogleDriveConfigSchema, process.env);
    return {
        credentialsB64: env.GOOGLE_APPLICATION_B64,
    };
});
