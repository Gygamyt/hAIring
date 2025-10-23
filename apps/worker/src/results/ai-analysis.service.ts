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
    ) {}

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
                `[Job ${parentJobId}] (AiAnalysisService) Mapping AI DTO to API Response DTO...`,
            );

            const finalResponse: ResultsAnalysisResponseDto = {
                message: 'Analysis pipeline completed successfully.',
                success: true,
                report: {
                    ai_summary: finalReport.aiSummary?.overallSummary ?? 'N/A',
                    candidate_info: {
                        full_name: finalReport.cvSummary?.fullName ?? 'N/A',
                        experience_years:
                            finalReport.cvSummary?.yearsOfExperience?.toString() ??
                            'N/A',
                        tech_stack: finalReport.cvSummary?.skills ?? [],
                        projects: [],
                        domains: [],
                        tasks: [],
                    },
                    interview_analysis: {
                        topics: finalReport.topics?.topics ?? [],
                        tech_assignment:
                            finalReport.technicalAssessment?.summary ?? 'N/A',
                        knowledge_assessment:
                            finalReport.technicalAssessment?.summary ?? 'N/A',
                    },
                    communication_skills: {
                        assessment:
                            finalReport.communicationSkills?.summary ?? 'N/A',
                    },
                    foreign_languages: {
                        assessment:
                            finalReport.languageAssessment?.summary ?? 'N/A',
                    },
                    team_fit: finalReport.valuesFit?.summary ?? 'N/A',
                    additional_information: [],
                    conclusion: {
                        recommendation:
                            finalReport.overallConclusion?.recommendation ??
                            'N/A',
                        assessed_level:
                            finalReport.overallConclusion?.recommendation ?? 'N/A',
                        summary:
                            finalReport.overallConclusion?.summary ?? 'N/A',
                    },
                    recommendations_for_candidate:
                        finalReport.overallConclusion?.feedbackForCandidate ?? [],
                },
            };

            this.logger.log(JSON.stringify(finalReport, null, 2));

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
                report: null as any,
            };
        }
    }
}
