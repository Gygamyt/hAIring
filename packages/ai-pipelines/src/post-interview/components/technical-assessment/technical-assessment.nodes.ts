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
            const techTraceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${techTraceId}`)}`,
            );
            logger.log(
                `${chalk.magenta('--- DEBUG LOG (TechnicalAssessment Node) ---')} | ${chalk.yellow(
                    'Received topics:',
                )} ${JSON.stringify(state.topicList)}`,
            );
            const chain = createTechnicalAssessmentGeneratePrompt().pipe(llm);

            const topicsList = state.topicList ?? [] as any;

            const formattedTopics = topicsList
                .map((topic: any) => `- "${topic}"`)
                .join('\n');

            const topicsInput = formattedTopics.length > 0
                ? formattedTopics
                : 'No specific topics provided for assessment.';

            const result = await chain.invoke(
                {
                    transcript: state.transcript,
                    topics: topicsInput, // <--- Передаем отформатированную строку
                },
                { metadata: { node: 'TechnicalAssessmentGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${techTraceId}`)}`,
            );

            return {
                rawTechnicalAssessment: getRawContent(result, logger),
                techTraceId,
                techRetries: 0,
                techValidationError: null,
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
    const traceId = state.techTraceId as string;
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
            retries: (state.techRetries as number | null ?? 0) + 1,
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
            const traceId = state.techTraceId as string;
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
                    validationError: state.techValidationError,
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
                techValidationError: null,
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
