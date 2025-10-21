import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    cvParserPrompt,
    requirementsParserPrompt,
    feedbackParserPrompt,
    fixCvJsonPrompt,
    fixRequirementsJsonPrompt,
    fixFeedbackJsonPrompt,
} from './parsing.prompts';
import { Logger } from '@nestjs/common';
import chalk from "chalk";
import { v4 as uuidv4 } from 'uuid';
import { getRawContent, validateAndParse } from '../../utils';
import { PreparationGraphState } from "./parsing.state";
import { AggregatedData, AggregatedDataSchema, CvData, CvDataSchema, FeedbackData, FeedbackDataSchema, RequirementsData, RequirementsDataSchema } from "./parsing.types";

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('ParsingNodes');

// --------------------------------------------------------------------------------
// --- TRACK 1: CV Parsing --------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from a CV.
 */
export const createCvGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const traceId = uuidv4();
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('CvGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        const chain = cvParserPrompt.pipe(llm);
        const result = await chain.invoke({ cvText: state.cvText }, { metadata: { node: 'CvGenerateNode' } });

        logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('CvGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
        return {
            rawCv: getRawContent(result, logger),
            traceId,
            cvRetries: 0,
            requirementsRetries: 0,
            feedbackRetries: 0,
            graphError: null,
        };
    };

/**
 * A synchronous node to VALIDATE the raw CV JSON output.
 */
export const validateCvNode = (
    state: PreparationGraphState
): { parsedCv?: CvData | null; cvError?: string | null; cvRetries?: number } => {
    const traceId = state.traceId as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateCvNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

    const { data, error } = validateAndParse(state.rawCv as string | null, CvDataSchema);

    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateCvNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error}`);
        return {
            cvError: error,
            cvRetries: (state.cvRetries as number ?? 0) + 1
        };
    }

    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateCvNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { parsedCv: data, cvError: null };
};

/**
 * Creates a node to "fix" an invalid CV JSON output.
 */
export const createFixCvNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixCvNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        const chain = fixCvJsonPrompt.pipe(llm);
        const result = await chain.invoke({
            error: state.cvError,
            rawOutput: state.rawCv,
        }, { metadata: { node: 'FixCvNode' } });

        logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixCvNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
        return { rawCv: getRawContent(result, logger) };
    };

// --------------------------------------------------------------------------------
// --- TRACK 2: Requirements Parsing ----------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from requirements.
 */
export const createRequirementsGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('RequirementsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        const chain = requirementsParserPrompt.pipe(llm);
        const result = await chain.invoke({ requirementsText: state.requirementsText }, { metadata: { node: 'RequirementsGenerateNode' } });

        logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('RequirementsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
        return { rawRequirements: getRawContent(result, logger) };
    };

/**
 * A synchronous node to VALIDATE the raw requirements JSON output.
 */
export const validateRequirementsNode = (
    state: PreparationGraphState
): { parsedRequirements?: RequirementsData | null; requirementsError?: string | null; requirementsRetries?: number } => {
    const traceId = state.traceId as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateRequirementsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

    const { data, error } = validateAndParse(state.rawRequirements as string | null, RequirementsDataSchema);

    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateRequirementsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error}`);
        return {
            requirementsError: error,
            requirementsRetries: (state.requirementsRetries as number ?? 0) + 1
        };
    }

    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateRequirementsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { parsedRequirements: data, requirementsError: null };
};

/**
 * Creates a node to "fix" an invalid requirements JSON output.
 */
export const createFixRequirementsNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixRequirementsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        const chain = fixRequirementsJsonPrompt.pipe(llm);
        const result = await chain.invoke({
            error: state.requirementsError,
            rawOutput: state.rawRequirements,
        }, { metadata: { node: 'FixRequirementsNode' } });

        logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixRequirementsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
        return { rawRequirements: getRawContent(result, logger) };
    };

// --------------------------------------------------------------------------------
// --- TRACK 3: Feedback Parsing --------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from feedback.
 */
export const createFeedbackGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('FeedbackGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        const chain = feedbackParserPrompt.pipe(llm);
        const result = await chain.invoke({ feedbackText: state.feedbackText }, { metadata: { node: 'FeedbackGenerateNode' } });

        logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('FeedbackGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
        return { rawFeedback: getRawContent(result, logger) };
    };

/**
 * A synchronous node to VALIDATE the raw feedback JSON output.
 */
export const validateFeedbackNode = (
    state: PreparationGraphState
): { parsedFeedback?: FeedbackData | null; feedbackError?: string | null; feedbackRetries?: number } => {
    const traceId = state.traceId as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateFeedbackNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

    const { data, error } = validateAndParse(state.rawFeedback as string | null, FeedbackDataSchema);

    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateFeedbackNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error}`);
        return {
            feedbackError: error,
            feedbackRetries: (state.feedbackRetries as number ?? 0) + 1
        };
    }

    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateFeedbackNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { parsedFeedback: data, feedbackError: null };
};

/**
 * Creates a node to "fix" an invalid feedback JSON output.
 */
export const createFixFeedbackNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixFeedbackNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        const chain = fixFeedbackJsonPrompt.pipe(llm);
        const result = await chain.invoke({
            error: state.feedbackError,
            rawOutput: state.rawFeedback,
        }, { metadata: { node: 'FixFeedbackNode' } });

        logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixFeedbackNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
        return { rawFeedback: getRawContent(result, logger) };
    };

// --------------------------------------------------------------------------------
// --- AGGREGATION & COMPLETION ---------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Aggregates parsed data. (ОБНОВЛЕНО)
 * Returns a `graphError` if any data is missing.
 */
export const aggregatorNode = (state: PreparationGraphState): { aggregatedResult: AggregatedData | null; graphError: string | null } => {
    const traceId = state.traceId as string;
    logger.log(`${chalk.blue('Aggregator Started')} ${chalk.green('for node:')} ${chalk.yellow('ParsingAggregator')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

    const parsedCv = state.parsedCv as CvData | null;
    const parsedRequirements = state.parsedRequirements as RequirementsData | null;
    const parsedFeedback = state.parsedFeedback as FeedbackData | null;

    if (!parsedCv || !parsedRequirements || !parsedFeedback) {
        const missing = [
            !parsedCv ? 'parsedCv' : null,
            !parsedRequirements ? 'parsedRequirements' : null,
            !parsedFeedback ? 'parsedFeedback' : null,
        ].filter(Boolean).join(', ');

        logger.error(`Aggregator failed: missing data for [${missing}]. TraceID: ${traceId}`);
        return {
            aggregatedResult: null,
            graphError: `Parsing Aggregator failed: missing data for [${missing}].`
        };
    }

    const aggregatedResult: AggregatedData = {
        candidate_info: parsedCv,
        job_requirements: parsedRequirements,
        recruiter_feedback: parsedFeedback,
    };

    logger.log(`${chalk.cyan('Aggregator Finished')} ${chalk.green('for node:')} ${chalk.yellow('ParsingAggregator')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { aggregatedResult: AggregatedDataSchema.parse(aggregatedResult), graphError: null };
};

/**
 * НОВЫЙ УЗЕЛ: A synchronous node that handles terminal failures.
 */
export const handleFailureNode = (state: PreparationGraphState): { graphError: string } => {
    const traceId = state.traceId as string;
    let finalError = "Parsing pipeline failed after all retries.";

    if ((state as any).cvError) finalError = `Failed on CV Parsing: ${(state as any).cvError}`;
    if ((state as any).requirementsError) finalError = `Failed on Requirements Parsing: ${(state as any).requirementsError}`;
    if ((state as any).feedbackError) finalError = `Failed on Feedback Parsing: ${(state as any).feedbackError}`;

    logger.error(`${chalk.red(finalError)} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { graphError: finalError };
};
