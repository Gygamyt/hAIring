import { ResultsProcessor } from "./results.processor";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ResultsService } from "./results.service";
import { TranscriptionModule } from "@hairing/transcription";
import { GoogleDriveModule } from "@hairing/google-drive";
import { DocumentParserModule } from "@hairing/document-parser";
import { AudioExtractorModule } from "../audio-extractor/audio-extractor.module";

@Module({
    imports: [
        // Register the queue this worker will process.
        // The name 'analysis-workflow' MUST match the name in apps/api.
        BullModule.registerQueue({
            name: 'analysis-workflow',
        }),

        // TODO: Import the package modules this service will need
        GoogleDriveModule,
        TranscriptionModule,
        DocumentParserModule,
        AudioExtractorModule
        // AiPipelinesModule,
    ],
    providers: [
        ResultsProcessor, // The class that listens for new jobs
        ResultsService,   // The class that contains the business logic
    ],
})

export class ResultsModule {}
