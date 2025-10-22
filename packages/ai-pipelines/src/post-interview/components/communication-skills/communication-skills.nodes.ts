import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { createFailureNode, createRetryRouter, getRawContent, validateAndParse } from '../../../utils';
import {
    CommunicationSkillsOutput,
    CommunicationSkillsOutputSchema,
} from './communication-skills.types';
import {
    createCommunicationSkillsGeneratePrompt,
    createCommunicationSkillsFixPrompt,
} from './communication-skills.prompts';
import { ICommunicationSkillsState } from "./communication-skills.state";

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('CommunicationSkillsNodes');
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- Communication Skills Parsing -----------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from a transcript.
 */
export const createCommunicationSkillsGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ICommunicationSkillsState,
        ): Promise<Partial<ICommunicationSkillsState>> => {
            const traceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            const chain = createCommunicationSkillsGeneratePrompt().pipe(llm);
            const result = await chain.invoke(
                { transcript: state.transcript },
                { metadata: { node: 'CommunicationSkillsGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            return {
                rawCommunicationSkills: getRawContent(result, logger),
                traceId,
                retries: 0,
                validationError: null,
                parsedCommunicationSkills: null,
            };
        };

/**
 * A synchronous node to VALIDATE the raw communication skills JSON output.
 */
export const validateCommunicationSkillsNode = (
    state: ICommunicationSkillsState,
): {
    parsedCommunicationSkills?: CommunicationSkillsOutput | null;
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
        state.rawCommunicationSkills as string | null,
        CommunicationSkillsOutputSchema,
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
    return { parsedCommunicationSkills: data, validationError: null };
};

/**
 * Creates a node to "fix" an invalid communication skills JSON output.
 */
export const createCommunicationSkillsFixNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ICommunicationSkillsState,
        ): Promise<Partial<ICommunicationSkillsState>> => {
            const traceId = state.traceId as string;
            logger.log(
                `${chalk.blue('Node Started (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            const chain = createCommunicationSkillsFixPrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    validationError: state.validationError,
                    invalidOutput: state.rawCommunicationSkills,
                },
                { metadata: { node: 'CommunicationSkillsFixNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            return {
                rawCommunicationSkills: getRawContent(result, logger),
                validationError: null, // Reset error before re-validation
            };
        };

// --------------------------------------------------------------------------------
// --- ROUTER & COMPLETION --------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * A synchronous node that handles terminal failures.
 */
/**
 * A synchronous node that handles terminal failures.
 * Generated from our common factory.
 */
export const handleFailureNode = createFailureNode(
    logger,
    'Failed on Communication Skills Parsing',
);

/**
 * Conditionally routes the graph based on the validationError and retry count.
 * Generated from our common factory.
 */
export const routerForCommunicationSkills = createRetryRouter(
    logger,
    MAX_RETRIES,
);
