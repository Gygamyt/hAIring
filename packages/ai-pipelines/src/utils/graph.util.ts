import { Logger } from '@nestjs/common';
import chalk from 'chalk';

/**
 * A generic state interface that our retryable subgraphs must implement.
 */
export interface IRetryableState {
    traceId: string | null;
    validationError: string | null;
    retries: number | null | undefined;
}

/**
 * Creates a generic conditional router for our Generate -> Validate -> Fix loop.
 *
 * @param logger - The NestJS logger instance (with context) to use for logging.
 * @param maxRetries - The maximum number of retries allowed before failing.
 */
export const createRetryRouter = (logger: Logger, maxRetries: number) => {
    return <T extends IRetryableState>(state: T) => {
        const traceId = state.traceId as string;
        const error = state.validationError;
        const retries = (state.retries as number | null ?? 0);

        if (!error) {
            logger.log(
                `Routing: ${chalk.cyan('Success')}. Proceeding to END. | ${chalk.gray(
                    `TraceID: ${traceId}`,
                )}`,
            );
            return 'success';
        }

        if (retries >= maxRetries) {
            logger.error(
                `Routing: ${chalk.red(
                    'Max retries reached',
                )}. Failing. | ${chalk.gray(`TraceID: ${traceId}`)}`,
            );
            return 'failure';
        }

        logger.warn(
            `Routing: ${chalk.yellow('Validation failed')}. Retrying (Attempt ${
                retries + 1
            }). | ${chalk.gray(`TraceID: ${traceId}`)}`,
        );
        return 'fix';
    };
};

/**
 * Creates a generic failure handler node for our subgraphs.
 *
 * @param logger - The NestJS logger instance (with context).
 * @param failureMessagePrefix - A specific prefix for the error log (e.g., "Failed on CV Parsing").
 */
export const createFailureNode = (
    logger: Logger,
    failureMessagePrefix: string,
) => {
    return <T extends IRetryableState>(
        state: T,
    ): { validationError: string } => {
        const traceId = state.traceId as string;
        const finalError = `${failureMessagePrefix}: ${state.validationError}`;

        logger.error(
            `${chalk.red(finalError)} ${chalk.green('|')} ${chalk.gray(
                `TraceID: ${traceId}`,
            )}`,
        );
        return { validationError: finalError };
    };
};
