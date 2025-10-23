import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config';
import { llmProvider } from './providers/llm.provider';
import { CandidatePipelineProvider } from "./providers/candidate.pipeline.provider";
import { LLM_PROVIDER, CANDIDATE_PIPELINE_PROVIDER, FINAL_REPORT_GRAPH_PROVIDER } from './constants';
import { FinalReportProvider } from "./providers/final-report.provider";

@Module({
    imports: [
        ConfigModule.forFeature(aiConfig),
    ],
    providers: [
        llmProvider,
        CandidatePipelineProvider,
        FinalReportProvider
    ],
    exports: [
        LLM_PROVIDER,
        CANDIDATE_PIPELINE_PROVIDER,
        FINAL_REPORT_GRAPH_PROVIDER,
    ],
})
export class AiCoreModule {
}
