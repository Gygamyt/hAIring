// apps/worker/src/results/results.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResultsProcessor } from './results.processor';
import { ResultsService } from './results.service'; // Keep for orchestration? Or remove if Processor handles it
import { GoogleDriveModule } from '@hairing/google-drive';
import { TranscriptionModule } from '@hairing/transcription';
import { DocumentParserModule } from '@hairing/document-parser';
import { DownloadService } from './download.service';
import { TranscriptionOrchestrationService } from './transcription-orchestration.service';
import { AiAnalysisService } from './ai-analysis.service';
import { AiCoreModule } from "@hairing/nest-ai";
// TODO: Import AiPipelinesModule when ready

@Module({
    imports: [
        BullModule.registerQueue({ name: 'analysis-workflow' }),
        GoogleDriveModule,
        TranscriptionModule,
        DocumentParserModule,
        AiCoreModule,
        // TODO: Add AiPipelinesModule later
    ],
    providers: [
        ResultsProcessor,
        ResultsService,
        DownloadService,
        TranscriptionOrchestrationService,
        AiAnalysisService,
    ],
})

export class ResultsModule {}
