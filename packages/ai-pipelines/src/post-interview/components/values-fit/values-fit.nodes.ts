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
import { IValuesFitState } from './values-fit.state';
import {
    ValuesFitOutput,
    ValuesFitOutputSchema,
} from './values-fit.types';
import {
    createValuesFitGeneratePrompt,
    createValuesFitFixPrompt,
} from './values-fit.prompts';

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('ValuesFitNodes');
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- Values Fit Parsing ---------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from a transcript and values list.
 */
export const createValuesFitGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: IValuesFitState,
        ): Promise<Partial<IValuesFitState>> => {
            const traceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            const chain = createValuesFitGeneratePrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    transcript: state.transcript,
                    companyValues: state.companyValues,
                },
                { metadata: { node: 'ValuesFitGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            return {
                rawValuesFit: getRawContent(result, logger),
                traceId,
                retries: 0,
                validationError: null,
                parsedValuesFit: null,
            };
        };

/**
 * A synchronous node to VALIDATE the raw values fit JSON output.
 */
export const validateValuesFitNode = (
    state: IValuesFitState,
): {
    parsedValuesFit?: ValuesFitOutput | null;
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
        state.rawValuesFit as string | null,
        ValuesFitOutputSchema,
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
    return { parsedValuesFit: data, validationError: null };
};

/**
 * Creates a node to "fix" an invalid values fit JSON output.
 */
export const createValuesFitFixNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: IValuesFitState,
        ): Promise<Partial<IValuesFitState>> => {
            const traceId = state.traceId as string;
            logger.log(
                `${chalk.blue('Node Started (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            const chain = createValuesFitFixPrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    validationError: state.validationError,
                    invalidOutput: state.rawValuesFit,
                },
                { metadata: { node: 'ValuesFitFixNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            return {
                rawValuesFit: getRawContent(result, logger),
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
    'Failed on Values Fit Parsing',
);

/**
 * Conditionally routes the graph based on the validationError and retry count.
 * Generated from our common factory.
 */
export const routerForValuesFit = createRetryRouter(logger, MAX_RETRIES);
