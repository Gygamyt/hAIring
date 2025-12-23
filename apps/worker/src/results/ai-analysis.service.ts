import { Injectable, Logger, Inject } from '@nestjs/common';
import chalk from 'chalk';
import {
    CompiledStateGraph,
    FINAL_REPORT_GRAPH_PROVIDER,
} from '@hairing/nest-ai';
import { ResultsAnalysisResponseDto } from '@hairing/dto/src';
import { IFinalReportState } from "@hairing/ai-pipelines/src/post-interview/final-report/finalreport.state";
import { FullReportDto } from "@hairing/ai-pipelines/src/post-interview/final-report/finalreport.types";

@Injectable()
export class AiAnalysisService {
    private readonly logger = new Logger(AiAnalysisService.name);

    constructor(
        @Inject(FINAL_REPORT_GRAPH_PROVIDER)
        private readonly finalReportPipeline: CompiledStateGraph<
            IFinalReportState,
            Partial<IFinalReportState>
        >,
    ) {
    }

    /**
     * Handles Step 3: Running the full AI analysis pipeline in a SINGLE call.
     * @param jobData The payload containing transcription and all context texts.
     * @returns The final analysis report structured as ResultsAnalysisResponseDto.
     */
    async run(jobData: {
        parentJobId: string;
        payload: {
            transcriptionText: string;
            matrixText: string;
            valuesText: string;
            portraitText: string;
            requirementsText: string;
            cvText: string;
            cvFileName?: string;
        };
    }): Promise<ResultsAnalysisResponseDto> {
        const { parentJobId, payload } = jobData;
        this.logger.log(
            `[Job ${parentJobId}] (AiAnalysisService) Starting Full AI Pipeline...`,
        );

        const {
            transcriptionText,
            valuesText,
            cvText,
        } = payload;

        try {
            this.logger.log(
                `[Job ${parentJobId}] (AiAnalysisService) Invoking Final Report pipeline...`,
            );

            const finalReportInput: Partial<IFinalReportState> = {
                interviewId: parentJobId,
                transcript: transcriptionText,
                cvText: cvText,
                companyValues: valuesText,
            };

            const finalReportState =
                await this.finalReportPipeline.invoke(finalReportInput);

            if (finalReportState.graphError) {
                this.logger.error(
                    `[Job ${parentJobId}] (AiAnalysisService) Final Report Pipeline failed: ${finalReportState.graphError}`,
                );
                throw new Error(
                    `AI Pipeline (Final Report) failed: ${finalReportState.graphError}`,
                );
            }
            if (!finalReportState.finalReport) {
                this.logger.error(
                    `[Job ${parentJobId}] (AiAnalysisService) Final Report finished but produced no 'finalReport' object.`,
                );
                throw new Error(
                    "AI Pipeline (Final Report) finished but produced no 'finalReport' object.",
                );
            }

            const finalReport = finalReportState.finalReport as FullReportDto;

            this.logger.log(
                `${chalk.blue(
                    `[Job ${parentJobId}] (AiAnalysisService) AI Pipeline successful. Report generated:`,
                )}`,
            );
            this.logger.log(JSON.stringify(finalReport, null, 2));

            const finalResponse: ResultsAnalysisResponseDto = {
                message: 'Analysis pipeline completed successfully.',
                success: true,
                report: finalReport,
            };

            this.logger.log(
                `${chalk.green(
                    `[Job ${parentJobId}] (AiAnalysisService) AI Step finished successfully. Report generated.`,
                )}`,
            );
            return finalResponse;

        } catch (error: any) {
            this.logger.error(
                `[Job ${parentJobId}] (AiAnalysisService) AI Step failed: ${error.message}`,
                error.stack,
            );

            return {
                message: `AI pipeline failed: ${error.message}`,
                success: false,
                report: undefined,
            };
        }
    }
}
