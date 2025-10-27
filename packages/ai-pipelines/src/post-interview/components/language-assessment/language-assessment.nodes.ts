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
import { ILanguageAssessmentState } from './language-assessment.state';
import {
    LanguageAssessmentOutput,
    LanguageAssessmentOutputSchema,
} from './language-assessment.types';
import {
    createLanguageAssessmentGeneratePrompt,
    createLanguageAssessmentFixPrompt,
} from './language-assessment.prompts';

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('LanguageAssessmentNodes');
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- Language Assessment Parsing ------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from a transcript.
 */
export const createLanguageAssessmentGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ILanguageAssessmentState,
        ): Promise<Partial<ILanguageAssessmentState>> => {
            const traceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            const chain = createLanguageAssessmentGeneratePrompt().pipe(llm);
            const result = await chain.invoke(
                { transcript: state.transcript },
                { metadata: { node: 'LanguageAssessmentGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            return {
                rawLanguageAssessment: getRawContent(result, logger),
                traceId,
                retries: 0,
                validationError: null,
                parsedLanguageAssessment: null,
            };
        };

/**
 * A synchronous node to VALIDATE the raw language assessment JSON output.
 */
export const validateLanguageAssessmentNode = (
    state: ILanguageAssessmentState,
): {
    parsedLanguageAssessment?: LanguageAssessmentOutput | null;
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
        state.rawLanguageAssessment as string | null,
        LanguageAssessmentOutputSchema,
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
    return { parsedLanguageAssessment: data, validationError: null };
};

/**
 * Creates a node to "fix" an invalid language assessment JSON output.
 */
export const createLanguageAssessmentFixNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ILanguageAssessmentState,
        ): Promise<Partial<ILanguageAssessmentState>> => {
            const traceId = state.traceId as string;
            logger.log(
                `${chalk.blue('Node Started (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            const chain = createLanguageAssessmentFixPrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    validationError: state.validationError,
                    invalidOutput: state.rawLanguageAssessment,
                },
                { metadata: { node: 'LanguageAssessmentFixNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            return {
                rawLanguageAssessment: getRawContent(result, logger),
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
    'Failed on Language Assessment Parsing',
);

/**
 * Conditionally routes the graph based on the validationError and retry count.
 * Generated from our common factory.
 */
export const routerForLanguageAssessment = createRetryRouter(logger, MAX_RETRIES);
