import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { getRawContent, validateAndParse } from '../../utils';
import {
    topicExtractorPrompt,
    fixTopicExtractorJsonPrompt,
} from './topic-extractor.prompts';
import {
    ExtractedTopics,
    ExtractedTopicsSchema,
} from './topic-extractor.types';
import { TopicExtractorState } from './topic-extractor.state';
import { BaseMessage } from '@langchain/core/messages';

// --- Logger ---
const logger = new Logger('TopicExtractorNodes');

// --------------------------------------------------------------------------------
// --- Topic Extractor Nodes ------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE the initial raw JSON for extracted topics.
 * Handles potential errors during the LLM invocation.
 */
export const createTopicExtractorGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: TopicExtractorState,
        ): Promise<Partial<TopicExtractorState>> => {
            const traceId = state.traceId ?? uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'TopicExtractorGenerateNode',
                )} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)}`,
            );

            const transcriptionText = state.transcriptionText as string | null;
            if (!transcriptionText) {
                logger.error(
                    `${chalk.red('Node Failed (Input Missing)')} ${chalk.green(
                        'for node:',
                    )} ${chalk.yellow('TopicExtractorGenerateNode')} ${chalk.green(
                        '|',
                    )} ${chalk.yellow(`TraceID: ${traceId}`)} Error: transcriptionText is missing.`,
                );
                return {
                    graphError: 'Input transcriptionText is missing for Topic Extractor.',
                    traceId,
                };
            }

            try {
                const chain = topicExtractorPrompt.pipe(llm);
                const result: BaseMessage = await chain.invoke(
                    { transcriptionText },
                    { metadata: { node: 'TopicExtractorGenerateNode' } },
                );

                logger.log(
                    `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                        'TopicExtractorGenerateNode',
                    )} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)}`,
                );
                return {
                    rawTopics: getRawContent(result, logger),
                    topicsRetries: 0,
                    traceId,
                    graphError: null,
                };
            } catch (error: any) {
                logger.error(
                    `${chalk.red('Node Failed (Invoke)')} ${chalk.green('for node:')} ${chalk.yellow(
                        'TopicExtractorGenerateNode',
                    )} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)} ${chalk.red(
                        'Error:',
                    )} ${error.message}`,
                );
                return {
                    rawTopics: null,
                    topicsError: `LLM call failed: ${error.message}`,
                    topicsRetries: 0,
                    traceId,
                };
            }
        };

/**
 * A synchronous node to VALIDATE the raw JSON output for extracted topics.
 * Updates state with parsed data or error message and increments retry count.
 */
export const validateTopicExtractorNode = (
    state: TopicExtractorState,
): {
    extractedTopics?: ExtractedTopics | null;
    topicsError?: string | null; // <--- The expected type
    topicsRetries?: number;
} => {
    const traceId = state.traceId as string;
    logger.log(
        `${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow(
            'validateTopicExtractorNode',
        )} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)}`,
    );

    // Handle errors passed directly from the generate node
    if (state.topicsError && !state.rawTopics) {
        logger.warn(
            `${chalk.yellow('Node Validated (Error from Generate)')} ${chalk.green(
                'for node:',
            )} ${chalk.yellow('validateTopicExtractorNode')} ${chalk.green(
                '|',
            )} ${chalk.yellow(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${
                state.topicsError
            }`,
        );
        return {
            topicsError: state.topicsError as string,
            topicsRetries: ((state.topicsRetries as number) ?? 0) + 1,
        };
    }

    // Validate the raw JSON from the generate node
    const { data, error } = validateAndParse(
        state.rawTopics as string | null, // Cast input state type
        ExtractedTopicsSchema,
    );

    // If validation failed
    if (error) {
        logger.warn(
            `${chalk.yellow('Node Validated (Error)')} ${chalk.green(
                'for node:',
            )} ${chalk.yellow('validateTopicExtractorNode')} ${chalk.green(
                '|',
            )} ${chalk.yellow(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error}`,
        );
        // --- EXPLICIT TYPE ASSERTION ---
        // Assert that 'error' conforms to the expected 'string | null' type
        return {
            topicsError: error as string | null,
            topicsRetries: ((state.topicsRetries as number) ?? 0) + 1,
        };
        // --- END ASSERTION ---
    }

    // If validation succeeded
    logger.log(
        `${chalk.cyan('Node Validated (Success)')} ${chalk.green(
            'for node:',
        )} ${chalk.yellow('validateTopicExtractorNode')} ${chalk.green(
            '|',
        )} ${chalk.yellow(`TraceID: ${traceId}`)}`,
    );
    return { extractedTopics: data, topicsError: null };
};

/**
 * Creates a node to FIX an invalid JSON output for extracted topics.
 * Handles potential errors during the LLM invocation.
 */
export const createFixTopicExtractorNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: TopicExtractorState,
        ): Promise<Partial<TopicExtractorState>> => {
            const traceId = state.traceId as string;
            logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixTopicExtractorNode')} ${chalk.green('|',)} ${chalk.yellow(`TraceID: ${traceId}`)}`,);

            const topicsError = state.topicsError as string | null;
            const rawTopics = state.rawTopics as string | null;

            if (!topicsError) {
                logger.warn(
                    `FixTopicExtractorNode called without an error in state. TraceID: ${traceId}`,
                );
                return { rawTopics };
            }

            try {
                const chain = fixTopicExtractorJsonPrompt.pipe(llm);
                const result: BaseMessage = await chain.invoke(
                    {
                        error: topicsError,
                        rawOutput: rawTopics || '',
                    },
                    { metadata: { node: 'FixTopicExtractorNode' } },
                );

                logger.log(
                    `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                        'for node:',
                    )} ${chalk.yellow('FixTopicExtractorNode')} ${chalk.green(
                        '|',
                    )} ${chalk.yellow(`TraceID: ${traceId}`)}`,
                );
                return { rawTopics: getRawContent(result, logger), topicsError: null };
            } catch (error: any) {
                logger.error(
                    `${chalk.red('Node Failed (Invoke during Fix)')} ${chalk.green(
                        'for node:',
                    )} ${chalk.yellow('FixTopicExtractorNode')} ${chalk.green(
                        '|',
                    )} ${chalk.yellow(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${
                        error.message
                    }`,
                );
                return {
                    rawTopics: rawTopics,
                    topicsError: `LLM call failed during fix: ${error.message}`,
                };
            }
        };

/**
 * A synchronous node that handles terminal failures for the topic extractor.
 * Logs the final error and sets the global graphError.
 */
export const handleTopicExtractorFailureNode = (
    state: TopicExtractorState,
): { graphError: string } => {
    const traceId = state.traceId as string;
    const finalError = `Topic Extractor failed after retries: ${
        state.topicsError || 'Unknown validation error'
    }`;

    logger.error(
        `${chalk.red(finalError)} ${chalk.green('|')} ${chalk.yellow(
            `TraceID: ${traceId}`,
        )}`,
    );
    return { graphError: finalError };
};
