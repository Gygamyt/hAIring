import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import * as base64 from 'base-64';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { JWT } from 'google-auth-library';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
    private readonly logger = new Logger(GoogleDriveService.name);
    private drive!: drive_v3.Drive;

    async onModuleInit() {
        try {
            const credentialsB64 = process.env.GOOGLE_APPLICATION_B64;
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
        } catch (error) {
            // @ts-ignore
            this.logger.error(`Error initializing Google Drive API client: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Извлекает ID файла из ссылки Google Drive.
     * Аналог `get_google_drive_file_id`.
     */
    private getFileIdFromLink(link: string): string {
        const match = link.match(/[-\w]{25,}/);
        if (match) {
            return match[0];
        }
        this.logger.error(`Invalid Google Drive link format: ${link}`);
        throw new Error('Invalid Google Drive link. Could not extract file ID.');
    }

    /**
     * Скачивает Google Sheet как CSV и возвращает его содержимое в виде строки.
     * Аналог `download_sheet_from_drive`.
     */
    async downloadSheet(link: string): Promise<string> {
        const fileId = this.getFileIdFromLink(link);
        this.logger.log(`Downloading sheet with ID: ${fileId} as CSV.`);
        try {
            const response = await this.drive.files.export({
                fileId,
                mimeType: 'text/csv',
            });
            return response.data as string;
        } catch (error) {
            // @ts-ignore
            this.logger.error(`Error exporting sheet from Google Drive: ${error.message}`);
            throw new Error(`Failed to download requirements from Google Drive for file ID: ${fileId}`);
        }
    }

    /**
     * Скачивает файл из Google Drive во временный файл на диске.
     * Возвращает путь к временному файлу.
     * Аналог `download_audio_from_drive_to_temp_file`.
     */
    async downloadFileToTemp(link: string): Promise<string> {
        const fileId = this.getFileIdFromLink(link);
        this.logger.log(`Downloading file with ID: ${fileId} to temp location.`);

        const tempFilePath = path.join(os.tmpdir(), `hairing-${fileId}-${Date.now()}`);
        const dest = fs.createWriteStream(tempFilePath);

        try {
            const response = await this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'stream' },
            );

            return new Promise((resolve, reject) => {
                const stream = response.data;

                stream.on('end', () => {
                    this.logger.log(`File downloaded successfully to ${tempFilePath}`);
                    resolve(tempFilePath);
                });

                stream.on('error', (err) => {
                    this.logger.error('Error during file download stream.', err);
                    fs.unlink(tempFilePath, () => reject(err));
                });

                stream.pipe(dest);
            });
        } catch (error) {
            // @ts-ignore
            this.logger.error(`Critical error downloading file: ${error.message}`);
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            throw error;
        }
    }
}
