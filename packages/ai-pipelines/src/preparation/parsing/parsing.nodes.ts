import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { cvParserPrompt, requirementsParserPrompt, feedbackParserPrompt } from './parsing.prompts';
import {
    PreparationGraphState,
    AggregatedData,
    CvDataSchema,
    RequirementsDataSchema,
    FeedbackDataSchema,
    CvData,
    RequirementsData,
    FeedbackData,
} from './parsing.state';
import { Logger } from '@nestjs/common';
import chalk from "chalk";

/**
 * Creates a parser node for CV texts.
 *
 * @param llm - An instance of ChatGoogleGenerativeAI to generate the parsing chain.
 * @returns An async function that takes the preparation state and returns parsed CV data.
 */
export const createCvParserNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const chain = cvParserPrompt.pipe(llm).pipe(new JsonOutputParser());
        const result = await chain.invoke({ cvText: state.cvText }, { metadata: { node: 'CvParserNode' } });
        const cvData = CvDataSchema.parse(result);
        return { parsedCv: cvData };
    };

/**
 * Creates a parser node for job requirements texts.
 *
 * @param llm - An instance of ChatGoogleGenerativeAI to generate the parsing chain.
 * @returns An async function that takes the preparation state and returns parsed requirements data.
 */
export const createRequirementsParserNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const chain = requirementsParserPrompt.pipe(llm).pipe(new JsonOutputParser());
        const result = await chain.invoke({ requirementsText: state.requirementsText }, { metadata: { node: 'RequirementsParserNode' } });
        const requirementsData = RequirementsDataSchema.parse(result);
        return { parsedRequirements: requirementsData };
    };

/**
 * Creates a parser node for recruiter feedback texts.
 *
 * @param llm - An instance of ChatGoogleGenerativeAI to generate the parsing chain.
 * @returns An async function that takes the preparation state and returns parsed feedback data.
 */
export const createFeedbackParserNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const chain = feedbackParserPrompt.pipe(llm).pipe(new JsonOutputParser());
        const result = await chain.invoke({ feedbackText: state.feedbackText }, { metadata: { node: 'FeedbackParserNode' } });
        const feedbackData = FeedbackDataSchema.parse(result);
        return { parsedFeedback: feedbackData };
    };

/**
 * Aggregates parsed CV, requirements, and feedback into a single result.
 *
 * @param state - The preparation state containing parsed data from previous nodes.
 * @throws If any parsed data is missing in the state.
 * @returns An object with the aggregated result conforming to AggregatedData.
 */
export const aggregatorNode = (state: PreparationGraphState): { aggregatedResult: AggregatedData } => {
    const logger = new Logger('AggregatorNode');
    const traceId = (state as any).traceId;
    logger.log(`${chalk.blue('Aggregator Started')} ${chalk.green('for node:')} ${chalk.yellow('ParsingAggregator')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)}`);

    if (!state.parsedCv || !state.parsedRequirements || !state.parsedFeedback) {
        const errorMessage = 'Aggregator received incomplete data.';
        logger.error({ traceId, message: errorMessage });
        throw new Error(errorMessage);
    }

    const aggregatedResult: AggregatedData = {
        candidate_info: state.parsedCv as CvData,
        job_requirements: state.parsedRequirements as RequirementsData,
        recruiter_feedback: state.parsedFeedback as FeedbackData,
    };

    logger.log(`${chalk.cyan('Aggregator Finished')} ${chalk.green('for node:')} ${chalk.yellow('ParsingAggregator')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)}`);

    return { aggregatedResult };
};
