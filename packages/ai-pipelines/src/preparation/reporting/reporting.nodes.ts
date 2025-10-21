import {
    InterviewTopics,
    InterviewTopicsSchema, // <-- Import from .types
    Recommendations,
    RecommendationsSchema, // <-- Import from .types
    Report,
    ReportSchema, // <-- Import from .types
    Summary,
    SummarySchema // <-- Import from .types
} from "./reporting.types"; // <-- THE FIX: Import from .types
import {
    ReportingGraphState,
} from "./reporting.state"; // <-- Import state separately
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { FinalResult } from "../grading"; // <-- This should point to grading.types.ts
import {
    interviewTopicsPrompt,
    recommendationsPrompt,
    summaryPrompt,
    fixSummaryJsonPrompt,
    fixRecommendationsJsonPrompt,
    fixInterviewTopicsJsonPrompt
} from "./reporting.prompts";
import { Logger } from '@nestjs/common';
import chalk from "chalk";
import { getRawContent, validateAndParse } from '../../utils';

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('ReportingNodes');

// --------------------------------------------------------------------------------
// --- TRACK 1: Summary -----------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE the raw summary JSON.
 */
export const createSummaryGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.gray('SummaryGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        try {
            const finalResult = state.finalResult as FinalResult;
            const chain = summaryPrompt.pipe(llm);
            const result = await chain.invoke({
                fullAssessmentData: JSON.stringify(finalResult),
            }, { metadata: { node: 'SummaryGenerateNode' } });

            logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('SummaryGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
            return {
                rawSummary: getRawContent(result, logger),
                summaryRetries: 0,
                recommendationsRetries: 0,
                topicsRetries: 0,
                graphError: null,
            };
        } catch (error: any) {
            logger.error(`${chalk.red('Node Failed (Invoke)')} ${chalk.green('for node:')} ${chalk.yellow('SummaryGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error.message}`);
            return {
                rawSummary: null,
                summaryError: `LLM call failed: ${error.message}`,
                summaryRetries: 0,
                recommendationsRetries: 0,
                topicsRetries: 0,
                graphError: null,
            };
        }
    };

/**
 * A synchronous node to VALIDATE the raw summary JSON.
 */
export const validateSummaryNode = (
    state: ReportingGraphState
): { summary?: Summary | null; summaryError?: string | null; summaryRetries?: number } => {
    const traceId = state.traceId as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateSummaryNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

    // Если ошибка пришла из GenerateNode, просто прокидываем ее
    if (state.summaryError && !state.rawSummary) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateSummaryNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${state.summaryError}`);
        return {
            summaryError: state.summaryError as string,
            summaryRetries: (state.summaryRetries as number ?? 0) + 1
        };
    }

    const { data, error } = validateAndParse(state.rawSummary as string | null, SummarySchema);

    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateSummaryNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error}`);
        return {
            summaryError: error,
            summaryRetries: (state.summaryRetries as number ?? 0) + 1
        };
    }

    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateSummaryNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { summary: data, summaryError: null };
};

/**
 * Creates a node to FIX an invalid summary JSON.
 */
export const createFixSummaryNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixSummaryNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        try {
            const chain = fixSummaryJsonPrompt.pipe(llm);
            const result = await chain.invoke({
                error: state.summaryError,
                rawOutput: state.rawSummary,
            }, { metadata: { node: 'FixSummaryNode' } });

            logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixSummaryNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
            return { rawSummary: getRawContent(result, logger) };
        } catch (error: any) {
            logger.error(`${chalk.red('Node Failed (Invoke)')} ${chalk.green('for node:')} ${chalk.yellow('FixSummaryNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error.message}`);
            return {
                rawSummary: state.rawSummary,
                summaryError: `LLM call failed during fix: ${error.message}`,
            };
        }
    };

// --------------------------------------------------------------------------------
// --- TRACK 2: Recommendations ---------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE the raw recommendations JSON.
 */
export const createRecommendationsGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('RecommendationsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        try {
            const finalResult = state.finalResult as FinalResult;
            const chain = recommendationsPrompt.pipe(llm);
            const result = await chain.invoke({
                criteriaMatching: JSON.stringify(finalResult.assessment.criteria_matching),
            }, { metadata: { node: 'RecommendationsGenerateNode' } });

            logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('RecommendationsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
            return { rawRecommendations: getRawContent(result, logger) };
        } catch (error: any) {
            logger.error(`${chalk.red('Node Failed (Invoke)')} ${chalk.green('for node:')} ${chalk.yellow('RecommendationsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error.message}`);
            return {
                rawRecommendations: null,
                recommendationsError: `LLM call failed: ${error.message}`,
            };
        }
    };

/**
 * A synchronous node to VALIDATE the raw recommendations JSON.
 */
export const validateRecommendationsNode = (
    state: ReportingGraphState
): { recommendations?: Recommendations | null; recommendationsError?: string | null; recommendationsRetries?: number } => {
    const traceId = state.traceId as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateRecommendationsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

    // Если ошибка пришла из GenerateNode
    if (state.recommendationsError && !state.rawRecommendations) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateRecommendationsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${state.recommendationsError}`);
        return {
            recommendationsError: state.recommendationsError as string,
            recommendationsRetries: (state.recommendationsRetries as number ?? 0) + 1
        };
    }

    const { data, error } = validateAndParse(state.rawRecommendations as string | null, RecommendationsSchema);

    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateRecommendationsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error}`);
        return {
            recommendationsError: error,
            recommendationsRetries: (state.recommendationsRetries as number ?? 0) + 1
        };
    }

    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateRecommendationsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { recommendations: data, recommendationsError: null };
};

/**
 * Creates a node to FIX an invalid recommendations JSON.
 */
export const createFixRecommendationsNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixRecommendationsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        try {
            const chain = fixRecommendationsJsonPrompt.pipe(llm);
            const result = await chain.invoke({
                error: state.recommendationsError,
                rawOutput: state.rawRecommendations,
            }, { metadata: { node: 'FixRecommendationsNode' } });

            logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixRecommendationsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
            return { rawRecommendations: getRawContent(result, logger) };
        } catch (error: any) {
            logger.error(`${chalk.red('Node Failed (Invoke)')} ${chalk.green('for node:')} ${chalk.yellow('FixRecommendationsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error.message}`);
            return {
                rawRecommendations: state.rawRecommendations,
                recommendationsError: `LLM call failed during fix: ${error.message}`,
            };
        }
    };

// --------------------------------------------------------------------------------
// --- TRACK 3: Interview Topics --------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to GENERATE the raw interview topics JSON.
 */
export const createInterviewTopicsGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('InterviewTopicsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        try {
            const finalResult = state.finalResult as FinalResult;
            const chain = interviewTopicsPrompt.pipe(llm);
            const result = await chain.invoke({
                fullAssessmentData: JSON.stringify(finalResult),
            }, { metadata: { node: 'InterviewTopicsGenerateNode' } });

            logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('InterviewTopicsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
            return { rawTopics: getRawContent(result, logger) };
        } catch (error: any) {
            logger.error(`${chalk.red('Node Failed (Invoke)')} ${chalk.green('for node:')} ${chalk.yellow('InterviewTopicsGenerateNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error.message}`);
            return {
                rawTopics: null,
                topicsError: `LLM call failed: ${error.message}`,
            };
        }
    };

/**
 * A synchronous node to VALIDATE the raw topics JSON.
 */
export const validateInterviewTopicsNode = (
    state: ReportingGraphState
): { interviewTopics?: InterviewTopics | null; topicsError?: string | null; topicsRetries?: number } => {
    const traceId = state.traceId as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateInterviewTopicsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

    // Если ошибка пришла из GenerateNode
    if (state.topicsError && !state.rawTopics) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateInterviewTopicsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${state.topicsError}`);
        return {
            topicsError: state.topicsError as string,
            topicsRetries: (state.topicsRetries as number ?? 0) + 1
        };
    }

    const { data, error } = validateAndParse(state.rawTopics as string | null, InterviewTopicsSchema);

    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateInterviewTopicsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)} ${chalk.red('Error:')} ${error}`);
        return {
            topicsError: error,
            topicsRetries: (state.topicsRetries as number ?? 0) + 1
        };
    }

    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateInterviewTopicsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { interviewTopics: data, topicsError: null };
};

/**
 * Creates a node to FIX an invalid topics JSON.
 */
export const createFixInterviewTopicsNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const traceId = state.traceId as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixInterviewTopicsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);

        const chain = fixInterviewTopicsJsonPrompt.pipe(llm);
        const result = await chain.invoke({
            error: state.topicsError,
            rawOutput: state.rawTopics,
        }, { metadata: { node: 'FixInterviewTopicsNode' } });

        logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixInterviewTopicsNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
        return { rawTopics: getRawContent(result, logger) };
    };

// --------------------------------------------------------------------------------
// --- AGGREGATION & COMPLETION ---------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * A synchronous node that builds the final report. (UPDATED)
 */
export const reportBuilderNode = (state: ReportingGraphState): { report: Report | null; graphError: string | null } => {
    const logger = new Logger('ReportBuilderNode'); // Logger initialized inside
    const traceId = state.traceId as string;

    logger.log(`${chalk.blue('Builder Started')} ${chalk.green('for node:')} ${chalk.yellow('ReportBuilderNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`)

    // Use casting to help TypeScript
    const finalResult = state.finalResult as FinalResult | null;
    const summary = state.summary as Summary | null;
    const recommendations = state.recommendations as Recommendations | null;
    const interviewTopics = state.interviewTopics as InterviewTopics | null;

    if (!finalResult || !summary || !recommendations || !interviewTopics) {
        const missing = [
            !finalResult ? 'finalResult' : null,
            !summary ? 'summary' : null,
            !recommendations ? 'recommendations' : null,
            !interviewTopics ? 'interviewTopics' : null,
        ].filter(Boolean).join(', ');

        logger.error(`Report builder failed: missing data for [${missing}]. TraceID: ${traceId}`);
        // Return error in state, DO NOT THROW
        return {
            report: null,
            graphError: `Report builder failed: missing data for [${missing}].`
        };
    }

    const report: Report = {
        first_name: finalResult.candidate_info.first_name,
        last_name: finalResult.candidate_info.last_name,
        matching_table: finalResult.assessment.criteria_matching,
        candidate_profile: `${finalResult.assessment.type}, ${finalResult.assessment.grade}`,
        conclusion: {
            summary: summary.summary,
            recommendations: recommendations.recommendations,
            interview_topics: interviewTopics.interview_topics,
            values_assessment: finalResult.assessment.values_assessment,
        },
    };

    const validatedReport = ReportSchema.parse(report);
    logger.log(`${chalk.cyan('Builder Finished')} ${chalk.green('for node:')} ${chalk.yellow('ReportBuilderNode')} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`)

    return { report: validatedReport, graphError: null };
};

/**
 * NEW: A synchronous node that handles terminal failures.
 */
export const handleFailureNode = (state: ReportingGraphState): { graphError: string } => {
    const logger = new Logger('ReportingFailure'); // Logger initialized inside
    const traceId = state.traceId as string;
    let finalError = "Reporting pipeline failed after all retries.";

    if ((state as any).summaryError) finalError = `Failed on Summary: ${(state as any).summaryError}`;
    if ((state as any).recommendationsError) finalError = `Failed on Recommendations: ${(state as any).recommendationsError}`;
    if ((state as any).topicsError) finalError = `Failed on Topics: ${(state as any).topicsError}`;

    logger.error(`${chalk.red(finalError)} ${chalk.green('|')} ${chalk.gray(`TraceID: ${traceId}`)}`);
    return { graphError: finalError };
};
