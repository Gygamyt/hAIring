import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
const pdf = require('pdf-parse');

@Injectable()
export class DocumentParserService {
    private readonly logger = new Logger(DocumentParserService.name);

    async read(fileBuffer: Buffer, filename: string): Promise<string> {
        this.logger.log(`Extracting text from file: ${filename}`);
        const extension = filename.split('.').pop()?.toLowerCase();

        try {
            if (extension === 'pdf') {
                const data = await pdf(fileBuffer);
                return data.text;
            } else if (extension === 'docx') {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                return result.value;
            } else {
                return fileBuffer.toString('utf-8');
            }
        } catch (error) {
            // @ts-ignore
            this.logger.error(`Error reading file ${filename}: ${error.message}`);
            throw new Error(`Could not process file: ${filename}`);
        }
    }
}
