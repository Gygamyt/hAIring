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
import { ITechnicalAssessmentState } from './technical-assessment.state';
import {
    TechnicalAssessmentOutput,
    TechnicalAssessmentOutputSchema,
} from './technical-assessment.types';
import {
    createTechnicalAssessmentGeneratePrompt,
    createTechnicalAssessmentFixPrompt,
} from './technical-assessment.prompts';

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('TechnicalAssessmentNodes');
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- Technical Assessment Parsing -----------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from a transcript and topics.
 */
export const createTechnicalAssessmentGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ITechnicalAssessmentState,
        ): Promise<Partial<ITechnicalAssessmentState>> => {
            const traceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            const chain = createTechnicalAssessmentGeneratePrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    transcript: state.transcript,
                    topics: state.topics,
                },
                { metadata: { node: 'TechnicalAssessmentGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            return {
                rawTechnicalAssessment: getRawContent(result, logger),
                traceId,
                retries: 0,
                validationError: null,
                parsedTechnicalAssessment: null,
            };
        };

/**
 * A synchronous node to VALIDATE the raw technical assessment JSON output.
 */
export const validateTechnicalAssessmentNode = (
    state: ITechnicalAssessmentState,
): {
    parsedTechnicalAssessment?: TechnicalAssessmentOutput | null;
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
        state.rawTechnicalAssessment as string | null,
        TechnicalAssessmentOutputSchema,
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
    return { parsedTechnicalAssessment: data, validationError: null };
};

/**
 * Creates a node to "fix" an invalid technical assessment JSON output.
 */
export const createTechnicalAssessmentFixNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ITechnicalAssessmentState,
        ): Promise<Partial<ITechnicalAssessmentState>> => {
            const traceId = state.traceId as string;
            logger.log(
                `${chalk.blue('Node Started (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            const chain = createTechnicalAssessmentFixPrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    validationError: state.validationError,
                    invalidOutput: state.rawTechnicalAssessment,
                },
                { metadata: { node: 'TechnicalAssessmentFixNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            return {
                rawTechnicalAssessment: getRawContent(result, logger),
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
    'Failed on Technical Assessment Parsing',
);

/**
 * Conditionally routes the graph based on the validationError and retry count.
 * Generated from our common factory.
 */
export const routerForTechnicalAssessment = createRetryRouter(logger, MAX_RETRIES);
