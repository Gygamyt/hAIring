import { Inject, Injectable, Logger } from '@nestjs/common';
import { ASSEMBLYAI_CLIENT } from './constants';
import chalk from 'chalk';
import { AssemblyAI, Transcript, TranscriptParams } from 'assemblyai';
import { logUtterances } from "./utils/formatter.utils";
import { TranscriptionOptions, TranscriptionResult } from "./types";

@Injectable()
export class TranscriptionService {
    private readonly logger = new Logger(TranscriptionService.name);

    constructor(
        @Inject(ASSEMBLYAI_CLIENT) private client: AssemblyAI,
    ) {
        this.logger.log('AssemblyAI client injected successfully.');
    }

    /**
     * Transcribes an audio file using AssemblyAI's standard transcription endpoint.
     * @param audioSource Path or URL to the audio file.
     * @param options Configuration for the transcription job.
     * @returns Detailed transcription results.
     */
    async transcribeFile(
        audioSource: string,
        options: TranscriptionOptions = {},
    ): Promise<TranscriptionResult> {
        const {
            languageDetection = false,
            languageCode = 'ru',
            punctuate = true,
            formatText = true,
            speakerLabels = true,
            speakersExpected = 2,
        } = options;

        this.logger.log(chalk.blue(`Starting file transcription for: ${audioSource}`));

        const config: any = { //fuck any, but I'm lazy
            audio: audioSource,
            punctuate: punctuate,
            format_text: formatText,
            speaker_labels: speakerLabels,
        };

        if (speakerLabels && speakersExpected > 0) {
            config.speakers_expected = speakersExpected;
        }

        if (languageCode) {
            config.language_code = languageCode as any;
            this.logger.log(chalk.cyan(`Using specified language_code: ${languageCode}`));
        } else if (languageDetection) {
            config.language_detection = true;
            // config.language_confidence_threshold = languageConfidenceThreshold;
            this.logger.log(chalk.cyan(`Using language_detection.`));
        } else {
            this.logger.warn(`No language_code specified and language_detection is off. AssemblyAI will attempt auto-detection.`);
        }

        // if (options.sentimentAnalysis) config.sentiment_analysis = true;
        // if (options.autoChapters) config.auto_chapters = true;
        // if (options.summarization) {
        //     config.summarization = true;
        //     if (options.summaryModel) config.summary_model = options.summaryModel;
        //     if (options.summaryType) config.summary_type = options.summaryType;
        // }

        let transcript: Transcript;
        try {
            this.logger.log(`Submitting transcription job with config: ${JSON.stringify(config)}`);
            transcript = await this.client.transcripts.transcribe(config);
            this.logger.log(`Transcription job submitted. Transcript ID: ${transcript.id}, Status: ${transcript.status}`);

            // Polling might be needed if transcribe doesn't wait, but SDK usually handles this.
            // If it returns immediately with 'queued', you'd need a polling loop:
            // while (transcript.status === 'queued' || transcript.status === 'processing') {
            //    await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds
            //    transcript = await this.client.transcripts.get(transcript.id);
            //    this.logger.log(`Polling status for ${transcript.id}: ${transcript.status}`);
            // }

        } catch (error: any) {
            this.logger.error(`Error submitting or retrieving transcription: ${error.message}`, error.stack);
            throw new Error(`AssemblyAI transcription failed: ${error.message}`);
        }

        if (transcript.utterances) {
            logUtterances(transcript, this.logger);
        } else {
            this.logger.warn(`Speaker labels (utterances) not found in transcription result for ID: ${transcript.id}`);
        }

        if (transcript.status === 'error') {
            this.logger.error(`Transcription failed for ID ${transcript.id}: ${transcript.error}`);
            throw new Error(`Transcription error for ID ${transcript.id}: ${transcript.error}`);
        }
        if (transcript.status !== 'completed') {
            this.logger.error(`Transcription finished with unexpected status '${transcript.status}' for ID ${transcript.id}`);
            throw new Error(`Transcription finished with status '${transcript.status}' for ID ${transcript.id}`);
        }

        this.logger.log(chalk.green(`Transcription completed successfully for ID: ${transcript.id}`));
        if (transcript.language_code) {
            this.logger.log(chalk.yellow(`Detected language: ${transcript.language_code}`));
        }

        return {
            text: transcript.text ?? null,
            detectedLanguage: transcript.language_code ?? null,
            audioId: transcript.id,
            words: transcript.words ?? null,
            utterances: transcript.utterances ?? null,
            // Map other results if requested in options
            // sentimentAnalysisResults: transcript.sentiment_analysis_results ?? null,
            // chapters: transcript.chapters ?? null,
            // summary: transcript.summary ?? null,
        };
    }
}
