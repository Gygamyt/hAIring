import { Module } from '@nestjs/common';
import { PreparationController } from './preparation.controller';
import { PreparationService } from './preparation.service';
import { DocumentParserModule } from "@hairing/document-parser";
import { GoogleDriveModule } from "@hairing/google-drive";
import { AiCoreModule } from '@hairing/nest-ai';

@Module({
    imports: [
        DocumentParserModule,
        GoogleDriveModule,
        AiCoreModule
    ],
    controllers: [PreparationController],
    providers: [PreparationService]
})
export class PreparationModule {

}
