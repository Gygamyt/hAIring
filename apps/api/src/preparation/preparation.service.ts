import {
    Injectable,
    Logger,
    HttpException,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { PreparationAnalysisResponseDto, ReportDto } from './dto/preparation-analysis-response.dto';
import { DocumentParserService } from '@hairing/document-parser';
import { GoogleDriveService } from '@hairing/google-drive';
import { CANDIDATE_PIPELINE_PROVIDER } from '@hairing/nest-ai';
import type { CompiledStateGraph } from '@langchain/langgraph';
import { CandidatePipelineState } from "@hairing/ai-pipelines/src/preparation/candidate.state";
import { v4 as uuidv4 } from 'uuid';
import chalk from "chalk";

@Injectable()
export class PreparationService {
    private readonly logger = new Logger(PreparationService.name);

    constructor(
        private readonly documentParserService: DocumentParserService,
        private readonly googleDriveService: GoogleDriveService,
        @Inject(CANDIDATE_PIPELINE_PROVIDER)
        private readonly candidatePipeline: CompiledStateGraph<
            CandidatePipelineState,
            Partial<CandidatePipelineState>
        >,
    ) {}

    async analyze(
        cvFileBuffer: Buffer | undefined,
        cvFileName: string | undefined,
        feedbackText: string,
        requirementsLink: string,
    ): Promise<PreparationAnalysisResponseDto> {
        let cvText = '';

        this.logger.log(`${chalk.green(`Starting full analysis for candidate file: ${chalk.bold(cvFileName)}`)}`,);

        if (cvFileBuffer && cvFileName) {
            this.logger.log(`${chalk.green(`CV file provided: ${chalk.bold(cvFileName)}. Extracting text.`)}`);
            cvText = await this.documentParserService.read(
                cvFileBuffer,
                cvFileName,
            );
            this.logger.log('CV text extracted successfully.');
        } else {
            this.logger.log('CV file not provided. Proceeding without it.');
        }

        try {
            const requirementsText =
                await this.googleDriveService.downloadSheet(requirementsLink);
            this.logger.log(
                'Requirements text downloaded successfully from Google Drive.',
            );

            const traceId = uuidv4();

            const pipelineInput: Partial<CandidatePipelineState> = {
                traceId,
                cvText,
                requirementsText,
                feedbackText,
            };

            this.logger.log('Invoking the AI candidate pipeline...');
            const finalState = await this.candidatePipeline.invoke(pipelineInput);

            const graphError = (finalState as any).graphError;

            if (graphError) {
                this.logger.error(`AI pipeline finished with a controlled error: ${graphError}`);
                throw new HttpException(
                    `Analysis failed: ${graphError}`,
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }

            this.logger.log('AI pipeline executed successfully.');

            if (!finalState?.report) {
                this.logger.error('AI pipeline finished successfully, but did not return the final report.');
                throw new Error('AI pipeline did not return the final report.');
            }

            this.logger.log('AI pipeline executed successfully.');

            return {
                success: true,
                message: 'Analysis successful.',
                report: finalState.report as ReportDto,
            };
        } catch (error) {
            // @ts-ignore
            this.logger.error(`An error occurred during the analysis pipeline: ${error.message}`);

            if (error instanceof HttpException) {
                throw error;
            }

            // @ts-ignore
            if (error.message.includes('Google Drive')) {
                // @ts-ignore
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            }

            throw new HttpException(
                'An internal server error occurred during analysis.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
