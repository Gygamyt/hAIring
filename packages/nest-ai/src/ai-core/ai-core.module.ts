// packages/nest-ai/src/ai-core/ai-core.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config';
import { llmProvider } from './providers/llm.provider';
import { candidatePipelineProvider } from "./providers/candidate.pipeline.provider";
import { TopicExtractorPipelineProvider } from "./providers/topic-extractor.provider";
// --- Import the constants ---
import { LLM_PROVIDER, CANDIDATE_PIPELINE_PROVIDER, TOPIC_EXTRACTOR_PROVIDER } from './constants';

@Module({
    imports: [
        ConfigModule.forFeature(aiConfig),
    ],
    providers: [
        llmProvider, // Correct: Provide the actual provider
        candidatePipelineProvider, // Correct
        TopicExtractorPipelineProvider, // Correct
    ],
    // --- CORRECTED EXPORTS ---
    exports: [
        LLM_PROVIDER, // Correct: Export the token
        CANDIDATE_PIPELINE_PROVIDER, // Correct
        TOPIC_EXTRACTOR_PROVIDER, // Correct: Export the token so others can @Inject it
    ],
    // --- END CORRECTION ---
})
export class AiCoreModule {
}
