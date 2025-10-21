import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import * as base64 from 'base-64';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { JWT } from 'google-auth-library';
import googleDriveConfig from "./config/google-drive.config";
import { ConfigType } from "@nestjs/config";
import chalk from 'chalk';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
    private readonly logger = new Logger(GoogleDriveService.name);
    private drive!: drive_v3.Drive;

    constructor(
        @Inject(googleDriveConfig.KEY)
        private readonly config: ConfigType<typeof googleDriveConfig>,
    ) {}

    /**
     * Initializes the Google Drive API client upon module initialization.
     * Reads credentials from config and sets up the googleapis drive instance.
     * @throws If credentials are not found or initialization fails.
     */
    async onModuleInit() {
        try {
            const credentialsB64 = this.config.credentialsB64;
            if (!credentialsB64) {
                throw new Error('GOOGLE_APPLICATION_B64 is not set in environment variables');
            }
            const credentialsJsonStr = base64.decode(credentialsB64);
            const credentialsInfo = JSON.parse(credentialsJsonStr);

            const auth = new JWT({
                email: credentialsInfo.client_email,
                key: credentialsInfo.private_key,
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            });

            this.drive = google.drive({ version: 'v3', auth });
            this.logger.log('Google Drive API client initialized successfully.');
        } catch (error: any) {
            this.logger.error(`Error initializing Google Drive API client: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Extracts the file ID from a Google Drive link (document, sheet, file).
     * @param link - The Google Drive shareable link.
     * @returns The extracted file ID.
     * @throws If the link is missing or invalid.
     */
    private getFileIdFromLink(link: string): string {
        if (!link) {
            this.logger.error('Google Drive link was not provided.');
            throw new Error('Google Drive link is required.');
        }

        const match = link.match(/\/d\/([-\w]{25,})|\/file\/d\/([-\w]{25,})/);

        const fileId = match ? (match[1] || match[2]) : null;

        if (fileId) {
            return fileId;
        }

        this.logger.error(`Invalid Google Drive link format: ${link}`);
        throw new Error('Invalid Google Drive link. Could not extract file ID.');
    }

    /**
     * Downloads a Google Sheet as CSV and returns its content as a string.
     * @param link - The Google Drive link to the sheet.
     * @returns The CSV content of the sheet as a string.
     * @throws If the download or export fails.
     */
    async downloadSheet(link: string): Promise<string> {
        const fileId = this.getFileIdFromLink(link);
        this.logger.log(`${chalk.green(`Downloading sheet with ID: ${chalk.bold(fileId)} as CSV.`)}`);
        try {
            const response = await this.drive.files.export({
                fileId,
                mimeType: 'text/csv',
            });
            if (typeof response.data === 'string') {
                return response.data;
            } else {
                this.logger.error(`Unexpected data type received for sheet export: ${typeof response.data}`);
                throw new Error('Failed to export sheet as CSV string.');
            }
        } catch (error: any) {
            this.logger.error(`Error exporting sheet from Google Drive (ID: ${fileId}): ${error.message}`);
            throw new Error(`Failed to download sheet from Google Drive for file ID: ${fileId}. Check permissions and link validity.`);
        }
    }

    /**
     * Downloads a file from Google Drive to a temporary file on disk.
     * **DEPRECATED:** Use `getDownloadStream` for better performance.
     * @param link - The Google Drive link to the file.
     * @returns The path to the temporary file.
     * @throws If the download fails.
     */
    async downloadFileToTemp(link: string): Promise<string> {
        const fileId = this.getFileIdFromLink(link);
        this.logger.warn(`Using deprecated downloadFileToTemp for file ID: ${fileId}. Consider using getDownloadStream.`);

        const tempFilePath = path.join(os.tmpdir(), `hairing-${fileId}-${Date.now()}`);
        const dest = fs.createWriteStream(tempFilePath);

        try {
            const response = await this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'stream' },
            );

            const stream = response.data as Readable;

            return new Promise((resolve, reject) => {
                stream.on('end', () => {
                    this.logger.log(`File downloaded successfully to ${tempFilePath}`);
                    resolve(tempFilePath);
                });
                stream.on('error', (err) => {
                    this.logger.error(`Error during file download stream (ID: ${fileId}) to ${tempFilePath}`, err.stack);
                    fs.unlink(tempFilePath, () => reject(err));
                });
                stream.pipe(dest);
            });
        } catch (error: any) {
            this.logger.error(`Critical error preparing download stream for file ID: ${fileId}: ${error.message}`, error.stack);
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            throw new Error(`Failed to download file from Google Drive (ID: ${fileId}). Check permissions and link validity.`);
        }
    }

    /**
     * Gets a readable stream for downloading a file from Google Drive.
     * This avoids saving the file to disk, allowing direct piping to other services (e.g., transcription).
     * @param link - The Google Drive link to the file.
     * @returns A Promise resolving to a Readable stream of the file content.
     * @throws If fetching the file metadata or the stream fails.
     */
    async getDownloadStream(link: string): Promise<Readable> {
        const fileId = this.getFileIdFromLink(link);
        this.logger.log(`${chalk.green(`Getting download stream for file ID: ${chalk.bold(fileId)}`)}`);

        try {
            const response = await this.drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );

            const stream = response.data as Readable;
            this.logger.log(`Successfully obtained download stream for file ID: ${fileId}`);
            return stream;

        } catch (error: any) {
            this.logger.error(`Failed to get download stream for file ID ${fileId}: ${error.message}`, error.stack);
            throw new Error(`Failed to get download stream from Google Drive (ID: ${fileId}). Check permissions and link validity.`);
        }
    }
}
