import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Readable } from 'stream';
import * as fs from 'fs';

import { GoogleDriveService } from './google-drive.service';

jest.mock('googleapis');
jest.mock('fs');

describe('GoogleDriveService', () => {
    let service: GoogleDriveService;

    const mockDriveClient = {
        files: {
            export: jest.fn(),
            get: jest.fn(),
        },
    };

    beforeEach(async () => {
        (google.drive as jest.Mock).mockReturnValue(mockDriveClient);
        (google.auth.GoogleAuth as jest.Mock) = jest.fn().mockImplementation(() => ({}));

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GoogleDriveService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('FAKE_BASE64_KEY'),
                    },
                },
            ],
        }).compile();

        service = module.get<GoogleDriveService>(GoogleDriveService);
        await service.onModuleInit();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('downloadSheet', () => {
        it('should download a sheet successfully', async () => {
            const link = 'https://docs.google.com/spreadsheets/d/VALID_FILE_ID/edit';
            const expectedCsv = 'header1,header2\nvalue1,value2';
            mockDriveClient.files.export.mockResolvedValue({ data: expectedCsv });

            const result = await service.downloadSheet(link);

            expect(result).toBe(expectedCsv);
            expect(mockDriveClient.files.export).toHaveBeenCalledWith({
                fileId: 'VALID_FILE_ID',
                mimeType: 'text/csv',
            });
        });

        it('should throw an error for an invalid link', async () => {
            const link = 'https://invalid-link.com';
            await expect(service.downloadSheet(link)).rejects.toThrow(
                'Invalid Google Drive link. Could not extract file ID.',
            );
        });
    });

    describe('downloadFileToTemp', () => {
        it('should download a file to a temp path successfully', async () => {
            const link = 'https://drive.google.com/file/d/AUDIO_FILE_ID/view';

            const mockReadStream = new Readable();
            mockReadStream.push('audio data');
            mockReadStream.push(null);

            mockDriveClient.files.get.mockResolvedValue({ data: mockReadStream });

            const mockWriteStream = {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === 'finish') {
                        callback();
                    }
                    return mockWriteStream;
                }),
                end: jest.fn(),
            };
            (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

            const resultPath = await service.downloadFileToTemp(link);

            expect(mockDriveClient.files.get).toHaveBeenCalledWith(
                { fileId: 'AUDIO_FILE_ID', alt: 'media' },
                { responseType: 'stream' },
            );
            expect(fs.createWriteStream).toHaveBeenCalled();
            expect(resultPath).toContain('hairing-AUDIO_FILE_ID');
        });
    });
});
