import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { createFailureNode, createRetryRouter, getRawContent, validateAndParse } from '../../../utils';
import { ICandidateInfoSummaryState } from "./candidate-info-summary.state";
import { createCandidateInfoSummaryFixPrompt, createCandidateInfoSummaryGeneratePrompt } from "./candidate-info-summary.prompts";
import { CandidateInfoSummaryOutput, CandidateInfoSummaryOutputSchema } from "./candidate-info-summary.types";


// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('CandidateInfoSummaryNodes');
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- CV Summary Parsing ---------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE raw structured data from a CV.
 */
export const createCandidateInfoSummaryGenerateNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ICandidateInfoSummaryState,
        ): Promise<Partial<ICandidateInfoSummaryState>> => {
            const traceId = uuidv4();
            logger.log(
                `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            const chain = createCandidateInfoSummaryGeneratePrompt().pipe(llm);
            const result = await chain.invoke(
                { cvText: state.cvText },
                { metadata: { node: 'CandidateInfoSummaryGenerateNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
                    'GenerateNode',
                )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
            );

            return {
                rawCvSummary: getRawContent(result, logger),
                traceId,
                retries: 0,
                validationError: null,
                parsedCv: null,
            };
        };

/**
 * A synchronous node to VALIDATE the raw CV summary JSON output.
 */
export const validateCandidateInfoSummaryNode = (
    state: ICandidateInfoSummaryState,
): {
    parsedCv?: CandidateInfoSummaryOutput | null;
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
        state.rawCvSummary as string | null,
        CandidateInfoSummaryOutputSchema,
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
    return { parsedCv: data, validationError: null };
};

/**
 * Creates a node to "fix" an invalid CV summary JSON output.
 */
export const createCandidateInfoSummaryFixNode =
    (llm: ChatGoogleGenerativeAI) =>
        async (
            state: ICandidateInfoSummaryState,
        ): Promise<Partial<ICandidateInfoSummaryState>> => {
            const traceId = state.traceId as string;
            logger.log(
                `${chalk.blue('Node Started (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            const chain = createCandidateInfoSummaryFixPrompt().pipe(llm);
            const result = await chain.invoke(
                {
                    validationError: state.validationError,
                    invalidOutput: state.rawCvSummary,
                },
                { metadata: { node: 'CandidateInfoSummaryFixNode' } },
            );

            logger.log(
                `${chalk.cyan('Node Finished (Fixing)')} ${chalk.green(
                    'for node:',
                )} ${chalk.yellow('FixNode')} ${chalk.green('|')} ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );

            return {
                rawCvSummary: getRawContent(result, logger),
                validationError: null,
            };
        };

// --------------------------------------------------------------------------------
// --- ROUTER & COMPLETION --------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * A synchronous node that handles terminal failures.
 */
export const handleFailureNode = createFailureNode(
    logger,
    'Failed on Communication Skills Parsing',
);


/**
 * Conditionally routes the graph based on the validationError and retry count.
 */
export const routerForCandidateInfoSummary = createRetryRouter(
    logger,
    MAX_RETRIES,
);
