import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';

@Injectable()
export class DocumentParserService {
    private readonly logger = new Logger(DocumentParserService.name);

    async read(fileBuffer: Buffer, filename: string): Promise<string> {
        this.logger.log(`Extracting text from file: ${filename}`);
        const extension = filename.split('.').pop()?.toLowerCase();

        try {
            if (extension === 'pdf') {
                return await this.extractPdfText(fileBuffer);
            } else if (extension === 'docx') {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                return result.value;

            } else {
                return fileBuffer.toString('utf-8');
            }
        } catch (error: any) {
            this.logger.error(`Error reading file ${filename}: ${error.message}`);
            throw new Error(`Could not process file: ${filename}`);
        }
    }

    private extractPdfText(fileBuffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            const pdfParser = new PDFParser();

            pdfParser.on('pdfParser_dataError', errData => {
                reject(new Error(errData.toString()));
            });

            pdfParser.on('pdfParser_dataReady', pdfData => {
                try {
                    const rawText = pdfParser.getRawTextContent();
                    resolve(rawText);
                } catch (err) {
                    reject(err);
                }
            });

            try {
                pdfParser.parseBuffer(fileBuffer);
            } catch (err) {
                reject(err);
            }
        });
    }
}
