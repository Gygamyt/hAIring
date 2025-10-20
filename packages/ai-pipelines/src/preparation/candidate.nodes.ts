import { CandidatePipelineState } from "./candidate.state";
import { Logger } from "@nestjs/common";
import chalk from "chalk";

/**
 * A terminal node that the graph routes to upon failure.
 * It doesn't need to do anything; the error is already in the state
 * and will be returned to the caller (PreparationService).
 */
export const failureNode = (state: CandidatePipelineState): { graphError?: string | null } => {
    const logger = new Logger('CandidatePipelineFailure');

    const traceID = (state as any).traceId || 'N/A';
    const graphError = (state as any).graphError || 'Unknown pipeline failure';

    logger.error(
        `${chalk.red.bold('PIPELINE FAILED')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)} ${chalk.red('|')} ${chalk.white(`Error: ${graphError}`)}`
    );

    return {};
};

/**
 * Checks the state for a 'graphError'.
 * If an error is present, routes to the 'failure' node.
 * Otherwise, allows the graph to continue.
 */
export const checkFailure = (state: CandidatePipelineState) => {
    const graphError = (state as any).graphError;
    return graphError ? 'failure' : '__CONTINUE__';
};
