import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import * as base64 from 'base-64';
import * as fs from 'fs';
import * as path from 'path';
import { JWT } from 'google-auth-library';
import googleDriveConfig from "./config/google-drive.config";
import { ConfigType } from "@nestjs/config";
import chalk from 'chalk';
import { Readable } from 'stream';
import { FileMetadata, pipeWithProgress } from "@hairing/utils/src";
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
    private readonly logger = new Logger(GoogleDriveService.name);
    private drive!: drive_v3.Drive;

    constructor(
        @Inject(googleDriveConfig.KEY)
        private readonly config: ConfigType<typeof googleDriveConfig>,
    ) {
    }

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
     * Downloads a file from Google Drive to a specified path, showing progress.
     * @param link - The Google Drive link to the file.
     * @param outputPath - The full path where the file should be saved.
     * @param totalSize - The total expected file size in bytes (obtained from getFileMetadata).
     * @returns A promise that resolves with the outputPath upon successful download.
     * @throws If the download fails.
     */
    async downloadFileToTemp(link: string, outputPath: string, totalSize: number): Promise<string> { // <-- Changed return type to Promise<string>
        const fileId = this.getFileIdFromLink(link);
        // Added basename for clearer logging
        const fileName = path.basename(outputPath);
        this.logger.log(`Downloading file '${fileName}' (ID: ${fileId}) to ${outputPath} with progress.`);

        const dest = fs.createWriteStream(outputPath);
        let downloadStream: Readable | null = null;

        try {
            const response = await this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'stream' },
            );
            downloadStream = response.data as Readable;

            // Wait for the download and progress to complete
            await pipeWithProgress(downloadStream, dest, totalSize, this.logger, `Downloading ${fileName}`);

            // If pipeWithProgress resolves, the download is complete
            this.logger.log(`File '${fileName}' successfully downloaded to ${outputPath}`);
            return outputPath; // <-- Return the output path on success

        } catch (error: any) {
            this.logger.error(`Critical error downloading file '${fileName}' (ID: ${fileId}): ${error.message}`, error.stack);
            if (downloadStream) downloadStream.destroy();
            dest.close((closeErr) => {
                if(closeErr) this.logger.error(`Error closing write stream for ${outputPath}: ${closeErr.message}`);
                if (fs.existsSync(outputPath)) {
                    try { fs.unlinkSync(outputPath); } catch (e: any) { this.logger.warn(`Failed to cleanup partial file ${outputPath}: ${e.message}`)}
                }
            });

            // Rethrow a more specific error
            throw new Error(`Failed to download file from Google Drive (ID: ${fileId}): ${error.message}`);
        }
    }

    /**
     * Gets metadata (name, size, mimeType) for a file in Google Drive.
     * @param link - The Google Drive link to the file.
     * @returns File metadata including size in bytes.
     * @throws If the file is not found or API call fails.
     */
    async getFileMetadata(link: string): Promise<FileMetadata> {
        const fileId = this.getFileIdFromLink(link);
        this.logger.log(`Fetching metadata for file ID: ${fileId}`);
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, size, mimeType',
            });

            const fileData = response.data;

            const sizeInBytes = fileData.size ? parseInt(fileData.size, 10) : 0;
            if (isNaN(sizeInBytes)) {
                this.logger.warn(`Could not parse size for file ID ${fileId}. Size reported: ${fileData.size}`);
                // throw new Error(`Invalid size reported by Google Drive API for file ID: ${fileId}`);
            }


            if (!fileData || !fileData.id || !fileData.name || !fileData.mimeType) {
                throw new Error(`Incomplete metadata received for file ID: ${fileId}`);
            }

            this.logger.log(`Metadata received for ${fileData.name} (Size: ${sizeInBytes} bytes)`);
            return {
                id: fileData.id,
                name: fileData.name,
                size: sizeInBytes,
                mimeType: fileData.mimeType,
            };
        } catch (error: any) {
            this.logger.error(`Error fetching metadata for file ID ${fileId}: ${error.message}`);
            throw new Error(`Failed to get metadata from Google Drive for file ID: ${fileId}. Check permissions and link validity.`);
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
}
