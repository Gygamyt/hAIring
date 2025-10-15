import { Module } from '@nestjs/common';
import { DocumentParserService } from './document-parser.service';

@Module({
    providers: [DocumentParserService],
    exports: [DocumentParserService],
})
export class DocumentParserModule {}