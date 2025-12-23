import { createTopicExtractorSubgraph } from "../components/topic-extractor";
import { createCandidateInfoSummarySubgraph } from "../components/candidate-info-summary";
import { Logger } from "@nestjs/common";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createCommunicationSkillsSubgraph } from "../components/communication-skills";
import { createTechnicalAssessmentSubgraph } from "../components/technical-assessment";
import { createValuesFitSubgraph } from "../components/values-fit";
import { createLanguageAssessmentSubgraph } from "../components/language-assessment";
import { createAiSummarySubgraph } from "../components/ai-summary";
import { createOverallConclusionSubgraph } from "../components/overall-conclusion";
import { FinalReportStateSchema, IFinalReportState } from "./finalreport.state";
import chalk from "chalk";
import { END, START, StateGraph } from "@langchain/langgraph";
import { reportBuilderNode } from "./finalreport.nodes";

const logger = new Logger('FinalReportGraph');

//todo add grade fot interviewer
//todo add vocabulary
//todo fix topic list

// --------------------------------------------------------------------------------
// --- Graph Definition -----------------------------------------------------------
// --------------------------------------------------------------------------------

export const createFinalReportSubgraph = (llm: ChatGoogleGenerativeAI) => {
    const topicExtractor = createTopicExtractorSubgraph(llm);
    const candidateInfoSummary = createCandidateInfoSummarySubgraph(llm);
    const communicationSkills = createCommunicationSkillsSubgraph(llm);
    const technicalAssessment = createTechnicalAssessmentSubgraph(llm);
    const valuesFit = createValuesFitSubgraph(llm);
    const languageAssessment = createLanguageAssessmentSubgraph(llm);
    const aiSummary = createAiSummarySubgraph(llm);
    const overallConclusion = createOverallConclusionSubgraph(llm);

    const createSubgraphAdapter = (
        subgraph: any,
        subgraphName: string,
        outputKeys: (keyof IFinalReportState)[],
    ) => {
        return async (state: IFinalReportState) => {
            logger.log(
                chalk.blue(`Adapter: Invoking ${subgraphName} subgraph...`),
            );
            const subGraphResponse = await subgraph.invoke(state);

            if (subGraphResponse.graphError) {
                logger.error(
                    `Adapter: Sub-graph ${subgraphName} failed: ${subGraphResponse.graphError}`,
                );
                throw new Error(
                    `Sub-graph ${subgraphName} failed: ${subGraphResponse.graphError}`,
                );
            }

            const output: Partial<IFinalReportState> = {};
            for (const key of outputKeys) {
                if (key === 'graphError') {
                    continue;
                }
                // @ts-ignore
                output[key] = subGraphResponse[key];
            }
            if (subgraphName === 'topicExtractor') {
                const topicsArray = subGraphResponse.extractedTopics as string[];
                logger.log(
                    `${chalk.magenta('--- DEBUG LOG (TopicExtractor Adapter) ---')} | ${chalk.yellow(
                        'Raw extractedTopics object:',
                    )} ${JSON.stringify(topicsArray)}`,
                );
                // @ts-ignore
                output.topicList = Array.isArray(topicsArray) ? topicsArray : [];

                // @ts-ignore
                delete output.extractedTopics;
            }

            logger.log(
                chalk.cyan(`Adapter: ${subgraphName} subgraph finished.`),
            );
            return output;
        };
    };

    const topicExtractorAdapter = createSubgraphAdapter(
        // @ts-expect-error todo fix signature
        topicExtractor, 'topicExtractor', ['extractedTopics', 'topicsError', 'graphError'],
    );
    const candidateInfoAdapter = createSubgraphAdapter(
        candidateInfoSummary, 'candidateInfoSummary', ['parsedCv', 'cvValidationError', 'graphError'],
    );
    const communicationSkillsAdapter = createSubgraphAdapter(
        communicationSkills, 'communicationSkills', ['parsedCommunicationSkills', 'commValidationError', 'graphError'],
    );
    const technicalAssessmentAdapter = createSubgraphAdapter(
        technicalAssessment, 'technicalAssessment', ['parsedTechnicalAssessment', 'techValidationError', 'graphError'],
    );
    const valuesFitAdapter = createSubgraphAdapter(valuesFit, 'valuesFit', [
        'parsedValuesFit', 'valuesValidationError', 'graphError',
    ]);
    const languageAssessmentAdapter = createSubgraphAdapter(
        languageAssessment, 'languageAssessment', ['parsedLanguageAssessment', 'langValidationError', 'graphError'],
    );
    const aiSummaryAdapter = createSubgraphAdapter(aiSummary, 'aiSummary', [
        'parsedAiSummary', 'summaryValidationError', 'graphError',
    ]);
    const overallConclusionAdapter = createSubgraphAdapter(
        overallConclusion, 'overallConclusion', ['parsedOverallConclusion', 'conclusionValidationError', 'graphError'],
    );

    const workflow = new StateGraph(FinalReportStateSchema)
        .addNode('topicExtractor', topicExtractorAdapter)
        .addNode('candidateInfoSummary', candidateInfoAdapter)
        .addNode('communicationSkills', communicationSkillsAdapter)
        .addNode('technicalAssessment', technicalAssessmentAdapter)
        .addNode('valuesFit', valuesFitAdapter)
        .addNode('languageAssessment', languageAssessmentAdapter)
        .addNode('aiSummary', aiSummaryAdapter)
        .addNode('overallConclusion', overallConclusionAdapter)
        .addNode('reportBuilder', reportBuilderNode);

    // --- Layer 1 (Parallel): Non-dependent tasks
    workflow.addEdge(START, 'candidateInfoSummary');
    workflow.addEdge(START, 'communicationSkills');
    workflow.addEdge(START, 'valuesFit');
    workflow.addEdge(START, 'languageAssessment');
    workflow.addEdge(START, 'topicExtractor');

    // --- Layer 2 (Dependent): Tasks that need `topics`
    workflow.addEdge('topicExtractor', 'technicalAssessment');
    workflow.addEdge('topicExtractor', 'aiSummary');

    // --- Layer 3 (Fan-in / Join):
    workflow.addEdge('candidateInfoSummary', 'overallConclusion');
    workflow.addEdge('communicationSkills', 'overallConclusion');
    workflow.addEdge('valuesFit', 'overallConclusion');
    workflow.addEdge('languageAssessment', 'overallConclusion');
    workflow.addEdge('technicalAssessment', 'overallConclusion');
    workflow.addEdge('aiSummary', 'overallConclusion');

    // --- Layer 5 (Final Steps):
    workflow.addEdge('overallConclusion', 'reportBuilder');
    workflow.addEdge('reportBuilder', END);

    return workflow.compile();
};
