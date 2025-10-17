import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config';
import { llmProvider } from './providers/llm.provider';
import { candidatePipelineProvider } from "./providers/candidate.pipeline.provider";


@Module({
    imports: [
        ConfigModule.forFeature(aiConfig),
    ],
    providers: [
        llmProvider,
        candidatePipelineProvider,
    ],
    exports: [
        llmProvider,
        candidatePipelineProvider,
    ],
})
export class AiCoreModule {}
