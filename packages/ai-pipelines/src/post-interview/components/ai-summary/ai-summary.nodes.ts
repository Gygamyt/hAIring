import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import {
    getRawContent,
    validateAndParse,
    createRetryRouter,
    createFailureNode,
} from '../../../utils';
import { IAiSummaryState } from './ai-summary.state';
import {
    AiSummaryOutput,
    AiSummaryOutputSchema,
} from './ai-summary.types';
import {
    createAiSummaryGeneratePrompt,
    createAiSummaryFixPrompt,
} from './ai-summary.prompts';

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('AiSummaryNodes');
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- AI Summary Parsing ---------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from a transcript and topics.
 */
export const createAiSummaryGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: IAiSummaryState,
        ): Promise<Partial<IAiSummaryState>> => {
            const traceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            const chain = createAiSummaryGeneratePrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    transcript: state.transcript,
                    topicList: state.topicList ?? [],
                },
                { metadata: { node: 'AiSummaryGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            return {
                rawAiSummary: getRawContent(result, logger),
                traceId,
                retries: 0,
                validationError: null,
                parsedAiSummary: null,
            };
        };

/**
 * A synchronous node to VALIDATE the raw AI summary JSON output.
 */
export const validateAiSummaryNode = (
    state: IAiSummaryState,
): {
    parsedAiSummary?: AiSummaryOutput | null;
    validationError?: string | null;
    retries?: number;
} => {
    const traceId = state.traceId as string;
    logger.log(
        `${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow(
            'ValidateNode',
        )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
    );

    const { data, error } = validateAndParse(
        state.rawAiSummary as string | null,
        AiSummaryOutputSchema,
    );

    if (error) {
        logger.warn(
            `${chalk.yellow('Node Validated (Error)')} ${chalk.green(
                'for node:',
            )} ${chalk.yellow('ValidateNode')} ${chalk.green('|')} ${chalk.gray(
                `TraceID: ${traceId}`,
            )} ${chalk.red('Error:')} ${error}`,
        );
        return {
            validationError: error,
            retries: (state.retries as number | null ?? 0) + 1,
        };
    }

    logger.log(
        `${chalk.cyan('Node Validated (Success)')} ${chalk.green(
            'for node:',
        )} ${chalk.yellow('ValidateNode')} ${chalk.green('|')} ${chalk.gray(
            `TraceID: ${traceId}`,
        )}`,
    );
    return { parsedAiSummary: data, validationError: null };
};

/**
 * Creates a node to "fix" an invalid AI summary JSON output.
 */
export const createAiSummaryFixNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: IAiSummaryState,
        ): Promise<Partial<IAiSummaryState>> => {
            const traceId = state.traceId as string;
            logger.log(
                `${chalk.blue('Node Started (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            const chain = createAiSummaryFixPrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    validationError: state.validationError,
                    invalidOutput: state.rawAiSummary,
                },
                { metadata: { node: 'AiSummaryFixNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            return {
                rawAiSummary: getRawContent(result, logger),
                validationError: null, // Reset error before re-validation
            };
        };

// --------------------------------------------------------------------------------
// --- ROUTER & COMPLETION --------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * A synchronous node that handles terminal failures.
 * Generated from our common factory.
 */
export const handleFailureNode = createFailureNode(
    logger,
    'Failed on AI Summary Parsing',
);

/**
 * Conditionally routes the graph based on the validationError and retry count.
 * Generated from our common factory.
 */
export const routerForAiSummary = createRetryRouter(logger, MAX_RETRIES);
