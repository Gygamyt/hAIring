import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config';
import { llmProvider } from './providers/llm.provider';

@Module({
    imports: [
        ConfigModule.forFeature(aiConfig),
    ],
    providers: [llmProvider],
    exports: [llmProvider],
})

export class AiCoreModule {}
