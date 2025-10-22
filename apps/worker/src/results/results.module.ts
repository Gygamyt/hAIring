import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResultsProcessor } from './results.processor';
import { ResultsService } from './results.service';
import { GoogleDriveModule } from '@hairing/google-drive';
import { TranscriptionModule } from '@hairing/transcription';
import { DocumentParserModule } from '@hairing/document-parser';
// Removed: import { AudioExtractorModule } from '../audio-extractor/audio-extractor.module';
// TODO: Import AiPipelinesModule when ready
// import { AiPipelinesModule } from '@hairing/nest-ai';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'analysis-workflow' }),
        GoogleDriveModule,
        TranscriptionModule,
        DocumentParserModule,
        // Removed: AudioExtractorModule,
        // TODO: Add AiPipelinesModule later
        // AiPipelinesModule,
    ],
    providers: [
        ResultsProcessor,
        ResultsService,
    ],
})

export class ResultsModule {}
