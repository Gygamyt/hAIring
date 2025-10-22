import { Injectable, Logger } from '@nestjs/common';
import { GoogleDriveService } from '@hairing/google-drive';
import { DocumentParserService } from '@hairing/document-parser';
import { Job } from 'bullmq'; // Import Job type if needed for logging/data access

@Injectable()
export class DownloadService {
    private readonly logger = new Logger(DownloadService.name);

    constructor(
        private readonly googleDriveService: GoogleDriveService,
        private readonly documentParserService: DocumentParserService,
    ) {}

    /**
     * Handles Step 1: Downloading sheets and parsing CV.
     * @param jobData The payload from the BullMQ job.
     * @returns The payload for the next job (transcription step).
     */
    async run(jobData: {
        parentJobId: string;
        payload: {
            video_link: string;
            competency_matrix_link: string;
            department_values_link: string;
            employee_portrait_link: string;
            job_requirements_link: string;
            cvFileBuffer?: { type: 'Buffer', data: number[] } | Buffer;
            cvFileName?: string;
        }
    }): Promise<any> {
        const { parentJobId, payload } = jobData;
        const {
            video_link,
            competency_matrix_link,
            department_values_link,
            employee_portrait_link,
            job_requirements_link,
            cvFileBuffer,
            cvFileName,
        } = payload;

        this.logger.log(`[Job ${parentJobId}] (DownloadService) Starting artifact download...`);

        const [ matrixText, valuesText, portraitText, requirementsText ] = await Promise.all([
            this.googleDriveService.downloadSheet(competency_matrix_link),
            this.googleDriveService.downloadSheet(department_values_link),
            this.googleDriveService.downloadSheet(employee_portrait_link),
            this.googleDriveService.downloadSheet(job_requirements_link),
        ]);
        this.logger.log(`[Job ${parentJobId}] (DownloadService) Sheets downloaded.`);

        let cvText = "CV was not provided for this analysis.";
        if (cvFileBuffer && cvFileName) {
            this.logger.log(`[Job ${parentJobId}] (DownloadService) Parsing CV: ${cvFileName}`);
            const buffer = Buffer.isBuffer(cvFileBuffer) ? cvFileBuffer : Buffer.from(cvFileBuffer.data);
            cvText = await this.documentParserService.read(buffer, cvFileName);
            this.logger.log(`[Job ${parentJobId}] (DownloadService) CV parsed.`);
        } else {
            this.logger.log(`[Job ${parentJobId}] (DownloadService) No CV provided.`);
        }

        return {
            video_link,
            matrixText,
            valuesText,
            portraitText,
            requirementsText,
            cvText,
            cvFileName,
        };
    }
}
