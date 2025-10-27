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
import { IOverallConclusionState } from './overall-conclusion.state';
import {
    OverallConclusionOutput,
    OverallConclusionOutputSchema,
} from './overall-conclusion.types';
import {
    createOverallConclusionGeneratePrompt,
    createOverallConclusionFixPrompt,
} from './overall-conclusion.prompts';

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('OverallConclusionNodes');
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- Overall Conclusion Parsing -------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE the final conclusion by synthesizing all inputs.
 */
export const createOverallConclusionGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: IOverallConclusionState,
        ): Promise<Partial<IOverallConclusionState>> => {
            const traceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            const chain = createOverallConclusionGeneratePrompt().pipe(llm);

            // Helper to safely stringify JSON, even if null/undefined
            const safeStringify = (data: any) => {
                return data ? JSON.stringify(data, null, 2) : 'N/A (No data provided)';
            };

            const result = await chain.invoke(
                {
                    parsedCv: safeStringify(state.parsedCv),
                    parsedTechnicalAssessment: safeStringify(
                        state.parsedTechnicalAssessment,
                    ),
                    parsedCommunicationSkills: safeStringify(
                        state.parsedCommunicationSkills,
                    ),
                    parsedValuesFit: safeStringify(state.parsedValuesFit),
                    parsedLanguageAssessment: safeStringify(
                        state.parsedLanguageAssessment,
                    ),
                    parsedAiSummary: safeStringify(state.parsedAiSummary),
                },
                { metadata: { node: 'OverallConclusionGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            return {
                rawOverallConclusion: getRawContent(result, logger),
                traceId,
                retries: 0,
                validationError: null,
                parsedOverallConclusion: null,
            };
        };

/**
 * A synchronous node to VALIDATE the raw overall conclusion JSON output.
 */
export const validateOverallConclusionNode = (
    state: IOverallConclusionState,
): {
    parsedOverallConclusion?: OverallConclusionOutput | null;
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
        state.rawOverallConclusion as string | null,
        OverallConclusionOutputSchema,
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
    return { parsedOverallConclusion: data, validationError: null };
};

/**
 * Creates a node to "fix" an invalid overall conclusion JSON output.
 */
export const createOverallConclusionFixNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: IOverallConclusionState,
        ): Promise<Partial<IOverallConclusionState>> => {
            const traceId = state.traceId as string;
            logger.log(
                `${chalk.blue('Node Started (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            const chain = createOverallConclusionFixPrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    validationError: state.validationError,
                    invalidOutput: state.rawOverallConclusion,
                },
                { metadata: { node: 'OverallConclusionFixNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            return {
                rawOverallConclusion: getRawContent(result, logger),
                validationError: null,
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
    'Failed on Overall Conclusion Parsing',
);

/**
 * Conditionally routes the graph based on the validationError and retry count.
 * Generated from our common factory.
 */
export const routerForOverallConclusion = createRetryRouter(logger, MAX_RETRIES);
