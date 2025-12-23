import { Inject, Injectable, Logger } from '@nestjs/common';
import { ASSEMBLYAI_CLIENT } from './constants';
import chalk from 'chalk';
import { AssemblyAI, Transcript } from 'assemblyai';
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
     * Supports Audio Intelligence features (Summary, Sentiment, Chapters).
     */
    async transcribeFile(
        audioSource: string,
        options: TranscriptionOptions = {},
    ): Promise<TranscriptionResult> {
        const {
            languageDetection = false,
            languageCode = 'ru',
            languageConfidenceThreshold,
            punctuate = true,
            formatText = true,
            speakerLabels = true,
            speakersExpected = 2,
            speechModel = 'best',
            keytermsPrompt,
            summarization,
            summaryModel,
            summaryType,
            sentimentAnalysis,
            autoChapters,
            entityDetection,
            piiRedaction,
            piiRedactionPolicy,
            filterProfanity,
        } = options;

        this.logger.log(chalk.blue(`Starting file transcription for: ${audioSource}`));

        const config: any = { //fuck any, but I'm lazy
            audio: audioSource,
            speech_model: speechModel,
            punctuate: punctuate,
            format_text: formatText,
            speaker_labels: speakerLabels,
            filter_profanity: filterProfanity,
        };

        // --- Speaker Diarization ---
        if (speakerLabels && speakersExpected > 0) {
            config.speakers_expected = speakersExpected;
        }

        // --- Language Settings ---
        if (languageDetection) {
            config.language_detection = true;
            if (languageConfidenceThreshold) {
                config.language_confidence_threshold = languageConfidenceThreshold;
            }
            this.logger.log(chalk.cyan(`Using automatic language detection.`));
        } else {
            config.language_code = languageCode as any; // Cast for SDK compatibility
            this.logger.log(chalk.cyan(`Using fixed language_code: ${languageCode}`));
        }

        // --- Accuracy Boost (Keyterms) ---
        if (keytermsPrompt && keytermsPrompt.length > 0) {
            config.keyterms_prompt = keytermsPrompt;
            this.logger.log(chalk.magenta(`Applying keyterms prompt for vocabulary boost.`));
        }

        // --- Audio Intelligence Settings ---
        if (summarization) {
            config.summarization = true;
            config.summary_model = summaryModel;
            config.summary_type = summaryType;
        }

        if (sentimentAnalysis) config.sentiment_analysis = true;
        if (autoChapters) config.auto_chapters = true;
        if (entityDetection) config.entity_detection = true;

        // --- Content Safety / Privacy ---
        if (piiRedaction) {
            config.redact_pii = true;
            if (piiRedactionPolicy) config.redact_pii_policies = piiRedactionPolicy as any;
        }

        let transcript: Transcript;
        try {
            this.logger.log(`Submitting job. Config: ${JSON.stringify({ ...config, audio: 'HIDDEN' })}`);
            transcript = await this.client.transcripts.transcribe(config);
        } catch (error: any) {
            this.logger.error(`AssemblyAI Error: ${error.message}`, error.stack);
            throw new Error(`AssemblyAI transcription failed: ${error.message}`);
        }

        // --- Result Validation ---
        if (transcript.status === 'error') {
            this.logger.error(`Transcription failed: ${transcript.error}`);
            throw new Error(`Transcription error: ${transcript.error}`);
        }

        if (transcript.utterances) {
            logUtterances(transcript, this.logger);
        }

        this.logger.log(chalk.green(`Transcription completed. ID: ${transcript.id}`));

        return {
            audioId: transcript.id,
            text: transcript.text ?? null,
            detectedLanguage: transcript.language_code ?? null,
            languageConfidence: transcript.language_confidence ?? null,
            words: transcript.words ?? null,
            utterances: transcript.utterances ?? null,
        };
    }
}
