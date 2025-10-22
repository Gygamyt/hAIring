import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config';
import { llmProvider } from './providers/llm.provider';
import { candidatePipelineProvider } from "./providers/candidate.pipeline.provider";
import { TopicExtractorPipelineProvider } from "./providers/topic-extractor.provider";
import { LLM_PROVIDER, CANDIDATE_PIPELINE_PROVIDER, TOPIC_EXTRACTOR_PROVIDER } from './constants';

@Module({
    imports: [
        ConfigModule.forFeature(aiConfig),
    ],
    providers: [
        llmProvider,
        candidatePipelineProvider,
        TopicExtractorPipelineProvider,
    ],
    exports: [
        LLM_PROVIDER,
        CANDIDATE_PIPELINE_PROVIDER,
        TOPIC_EXTRACTOR_PROVIDER,
    ],
})
export class AiCoreModule {
}
