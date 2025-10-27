import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { transcriptionConfig } from "./config/transcription.config";
import { TranscriptionService } from "./transcription.service";
import { ASSEMBLYAI_CLIENT } from "./constants";
import { AssemblyAI } from "assemblyai";


@Module({
    imports: [
        ConfigModule.forFeature(transcriptionConfig),
    ],
    providers: [
        TranscriptionService,
        {
            provide: ASSEMBLYAI_CLIENT,
            useFactory: (config: ConfigType<typeof transcriptionConfig>) => {
                if (!config.apiKey) {
                    throw new Error('AssemblyAI API key not configured.');
                }
                return new AssemblyAI({ apiKey: config.apiKey });
            },
            inject: [transcriptionConfig.KEY],
        },
    ],
    exports: [
        TranscriptionService
    ],
})
export class TranscriptionModule {
}
