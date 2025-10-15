import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';

import { TranscriptionService } from './transcription.service';
import { AssemblyAI } from 'assemblyai';

jest.mock('assemblyai');

jest.mock('fs/promises', () => ({
    stat: jest.fn(),
}));

describe('TranscriptionService', () => {
    let service: TranscriptionService;
    let mockConfigService: ConfigService;

    const mockAssemblyAIClient = {
        transcripts: {
            transcribe: jest.fn(),
        },
    };

    beforeEach(async () => {
        (AssemblyAI as jest.Mock).mockReturnValue(mockAssemblyAIClient);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TranscriptionService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('fake-api-key'), // По умолчанию он возвращает фейковый ключ
                    },
                },
            ],
        }).compile();

        service = module.get<TranscriptionService>(TranscriptionService);
        mockConfigService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return transcript text on successful transcription', async () => {
        const audioPath = 'path/to/audio.mp3';
        const expectedText = 'Hello world';

        (fs.stat as jest.Mock).mockResolvedValue({ size: 1024 });
        mockAssemblyAIClient.transcripts.transcribe.mockResolvedValue({
            status: 'completed',
            text: expectedText,
        });

        const result = await service.transcribe(audioPath);

        expect(result).toBe(expectedText);
        expect(fs.stat).toHaveBeenCalledWith(audioPath);
        expect(mockAssemblyAIClient.transcripts.transcribe).toHaveBeenCalledWith({
            audio: audioPath,
            language_detection: true,
        });
    });

    it('should throw an error if transcription status is "error"', async () => {
        const audioPath = 'path/to/audio.mp3';
        const errorMessage = 'Transcription failed due to invalid audio.';

        (fs.stat as jest.Mock).mockResolvedValue({ size: 1024 });
        mockAssemblyAIClient.transcripts.transcribe.mockResolvedValue({
            status: 'error',
            error: errorMessage,
        });

        await expect(service.transcribe(audioPath)).rejects.toThrow(
            `Transcription failed: ${errorMessage}`,
        );
    });

    it('should throw an error if audio file does not exist', async () => {
        const audioPath = 'path/to/nonexistent.mp3';
        (fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

        await expect(service.transcribe(audioPath)).rejects.toThrow(
            `Audio file not found at ${audioPath}`,
        );

        expect(mockAssemblyAIClient.transcripts.transcribe).not.toHaveBeenCalled();
    });
});