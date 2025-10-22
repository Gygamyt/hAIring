import { Injectable, Logger, Inject } from '@nestjs/common';
import chalk from 'chalk';
import { CompiledStateGraph, TOPIC_EXTRACTOR_PROVIDER } from "@hairing/nest-ai";
import { ExtractedTopics, TopicExtractorState } from "@hairing/ai-pipelines/src/post-interview/topic-extractor";
import { ResultsAnalysisResponseDto } from "@hairing/dto/src";

@Injectable()
export class AiAnalysisService {
    private readonly logger = new Logger(AiAnalysisService.name);

    constructor(
        @Inject(TOPIC_EXTRACTOR_PROVIDER)
        private readonly topicExtractorPipeline: CompiledStateGraph<
            TopicExtractorState,
            Partial<TopicExtractorState>
        >,
        // TODO: Inject the Final Report Pipeline provider here later
    ) {}

    /**
     * Handles Step 3: Running the AI analysis, starting with Topic Extraction.
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
        }
    }): Promise<ResultsAnalysisResponseDto> {
        const { parentJobId, payload } = jobData;
        this.logger.log(`[Job ${parentJobId}] (AiAnalysisService) Starting AI Step: Topic Extraction...`);
        // Destructure all needed fields from payload
        const {
            transcriptionText,
            matrixText,
            valuesText,
            portraitText,
            requirementsText,
            cvText,
            cvFileName
        } = payload;

        // Prepare Input for Topic Extractor
        const pipelineInput: Partial<TopicExtractorState> = {
            traceId: parentJobId,
            transcriptionText: transcriptionText,
            // Ensure all necessary input fields defined in TopicExtractorState are here
            // If TopicExtractorState doesn't need other texts, no need to include them
        };

        let topicExtractorState: Partial<TopicExtractorState>;
        try {
            // Invoke Topic Extractor Subgraph
            this.logger.log(`[Job ${parentJobId}] (AiAnalysisService) Invoking Topic Extractor pipeline...`);
            topicExtractorState = await this.topicExtractorPipeline.invoke(pipelineInput);
            this.logger.log(`[Job ${parentJobId}] (AiAnalysisService) Topic Extractor pipeline finished.`);

            // Check for Graph Error from Topic Extractor
            if (topicExtractorState.graphError) {
                this.logger.error(`[Job ${parentJobId}] (AiAnalysisService) Topic Extractor Pipeline failed: ${topicExtractorState.graphError}`);
                throw new Error(`AI Pipeline (Topic Extractor) failed: ${topicExtractorState.graphError}`);
            }
            if (!topicExtractorState.extractedTopics) {
                this.logger.error(`[Job ${parentJobId}] (AiAnalysisService) Topic Extractor finished but produced no topics object.`);
                throw new Error('AI Pipeline (Topic Extractor) finished but produced no topics object.');
            }

            // Assert type and extract topics
            const extractedTopicsData = topicExtractorState.extractedTopics as ExtractedTopics;
            const extractedTopics = extractedTopicsData.topics;

            if (!extractedTopics || extractedTopics.length === 0) {
                this.logger.warn(`[Job ${parentJobId}] (AiAnalysisService) Topic Extractor finished but the topics array is empty.`);
                // Consider if empty topics is an error or acceptable result
            }

            this.logger.warn(JSON.stringify(extractedTopics, null, 2));

            this.logger.log(`${chalk.green(`[Job ${parentJobId}] (AiAnalysisService) Successfully extracted ${extractedTopics?.length ?? 0} topics.`)}`);

            // --- TODO: Invoke Final Report Pipeline ---
            // The input for the next pipeline would likely include:
            // - parentJobId (as traceId)
            // - extractedTopics
            // - transcriptionText
            // - matrixText, valuesText, portraitText, requirementsText, cvText
            /*
            const finalReportInput: Partial<FinalReportState> = {
                traceId: parentJobId,
                extractedTopics: extractedTopicsData, // Pass the object if needed
                transcriptionText,
                matrixText,
                valuesText,
                portraitText,
                requirementsText,
                cvText
            };
            const finalReportState = await this.finalReportPipeline.invoke(finalReportInput);
            if(finalReportState.graphError) { ... }
            if(!finalReportState.report) { ... }
            const finalReportData = finalReportState.report as FullReportDto;
            */
            // --- END TODO ---

            // --- Construct Final Response (Using real topics, real CV info if available, rest STUBBED) ---
            // Replace this stubbed report construction with data from the finalReportState.report when implemented
            const finalResponse: ResultsAnalysisResponseDto = {
                message: "Analysis steps completed. Topic extraction successful. Final report stubbed.",
                success: true,
                report: { // Structure matching FullReportDto
                    ai_summary: `AI summary for job ${parentJobId} (stub)`,
                    // Use actual CV info if needed, otherwise keep stub
                    candidate_info: {
                        full_name: cvFileName || "N/A", // Use filename if available
                        experience_years: "N/A (stub)", // Needs extraction from cvText by AI
                        tech_stack: [], // Needs extraction from cvText by AI
                        projects: [], // Needs extraction from cvText by AI
                        domains: [], // Needs extraction from cvText by AI
                        tasks: [] // Needs extraction from cvText by AI
                    },
                    interview_analysis: {
                        topics: extractedTopics || [], // Use REAL extracted topics
                        tech_assignment: "N/A (stub)", // Needs final report AI
                        knowledge_assessment: "N/A (stub)" // Needs final report AI
                    },
                    communication_skills: { assessment: "N/A (stub)" }, // Needs final report AI
                    foreign_languages: { assessment: "N/A (stub)" }, // Needs final report AI
                    team_fit: "N/A (stub)", // Needs final report AI
                    additional_information: [], // Needs final report AI
                    conclusion: { // Needs final report AI
                        recommendation: "N/A (stub)",
                        assessed_level: "N/A (stub)",
                        summary: "N/A (stub)"
                    },
                    recommendations_for_candidate: [] // Needs final report AI
                }
            };
            // --- End Final Response ---

            this.logger.log(`[Job ${parentJobId}] (AiAnalysisService) AI Step finished successfully.`);
            return finalResponse;

        } catch (error: any) {
            this.logger.error(`[Job ${parentJobId}] (AiAnalysisService) AI Step failed: ${error.message}`, error.stack);
            throw error; // Re-throw for the processor
        }
    }
}
