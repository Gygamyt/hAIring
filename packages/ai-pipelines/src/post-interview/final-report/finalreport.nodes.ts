import { Logger } from '@nestjs/common';
import chalk from 'chalk';
import { IFinalReportState } from './finalreport.state';
import { FullReportDto } from './finalreport.types';

const logger = new Logger('FinalReportNode');

/**
 * A synchronous node that assembles the final report DTO.
 *
 * It collects all the individual analysis DTOs from the master state
 * and packages them into the final `FullReportDto`.
 */
export const reportBuilderNode = (
    state: IFinalReportState,
): { finalReport: FullReportDto } => {
    const traceId = state.graphError || 'builder-trace';
    logger.log(
        `${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow(
            'ReportBuilderNode',
        )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
    );

    const {
        topics,
        parsedCv,
        parsedCommunicationSkills,
        parsedValuesFit,
        parsedTechnicalAssessment,
        parsedLanguageAssessment,
        parsedAiSummary,
        parsedOverallConclusion,
    } = state;

    //todo FUCKING fix this sshiiieeet

    const finalReport: FullReportDto = {
        topics: Array.isArray(topics) ? { topics: topics } : undefined,

        cvSummary: isValidDtoObject(parsedCv)
            ? (parsedCv as any)
            : undefined,
        communicationSkills: isValidDtoObject(parsedCommunicationSkills)
            ? (parsedCommunicationSkills as any)
            : undefined,
        valuesFit: isValidDtoObject(parsedValuesFit)
            ? (parsedValuesFit as any)
            : undefined,
        technicalAssessment: isValidDtoObject(parsedTechnicalAssessment)
            ? (parsedTechnicalAssessment as any)
            : undefined,
        languageAssessment: isValidDtoObject(parsedLanguageAssessment)
            ? (parsedLanguageAssessment as any)
            : undefined,
        aiSummary: isValidDtoObject(parsedAiSummary)
            ? (parsedAiSummary as any)
            : undefined,
        overallConclusion: isValidDtoObject(parsedOverallConclusion)
            ? (parsedOverallConclusion as any)
            : undefined,
    };

    logger.log(
        `${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow(
            'ReportBuilderNode',
        )} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`,
    );

    return { finalReport };
};

/**
 * A synchronous node that handles a catastrophic failure of the orchestrator.
 * This should only be hit if a subgraph fails *and* the main graph logic fails.
 */
export const handleOrchestratorFailureNode = (
    state: IFinalReportState,
): { graphError: string } => {
    const finalError = `FinalReport Orchestrator failed: ${state.graphError}`;
    logger.error(`${chalk.red(finalError)}`);
    return { graphError: finalError };
};

const isValidDtoObject = (obj: any): boolean => {
    return (
        obj && // not null, undefined, false, 0, ""
        typeof obj === 'object' && // is an object
        !Array.isArray(obj) && // is not an array
        Object.keys(obj).length > 0 // V THIS IS THE KEY: it MUST HAVE properties
    );
};
