import {
    InterviewTopics,
    InterviewTopicsSchema,
    Recommendations,
    RecommendationsSchema,
    Report,
    ReportingGraphState,
    ReportSchema,
    Summary,
    SummarySchema
} from "./reporting.state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { FinalResult } from "../grading";
import { interviewTopicsPrompt, recommendationsPrompt, summaryPrompt } from "./reporting.prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { Logger } from '@nestjs/common';
import chalk from "chalk";

/**
 * Creates a node to generate a comprehensive summary.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that generates the summary.
 */
export const createSummaryNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const finalResult = state.finalResult as FinalResult;

        const chain = summaryPrompt.pipe(llm).pipe(new JsonOutputParser());
        const result = await chain.invoke({
            fullAssessmentData: JSON.stringify(finalResult),
        }, { metadata: { node: 'SummaryNode' } });

        const summary = SummarySchema.parse(result);
        return { summary };
    };

/**
 * Creates a node to generate recommendations for the candidate.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that generates recommendations.
 */
export const createRecommendationsNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const finalResult = state.finalResult as FinalResult;

        const chain = recommendationsPrompt.pipe(llm).pipe(new JsonOutputParser());
        const result = await chain.invoke({
            criteriaMatching: JSON.stringify(finalResult.assessment.criteria_matching),
        }, { metadata: { node: 'RecommendationsNode' } });

        const recommendations = RecommendationsSchema.parse(result);
        return { recommendations };
    };

/**
 * Creates a node to generate interview topics.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that generates interview topics.
 */
export const createInterviewTopicsNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: ReportingGraphState): Promise<Partial<ReportingGraphState>> => {
        const finalResult = state.finalResult as FinalResult;

        const chain = interviewTopicsPrompt.pipe(llm).pipe(new JsonOutputParser());
        const result = await chain.invoke({
            fullAssessmentData: JSON.stringify(finalResult),
        }, { metadata: { node: 'InterviewTopicsNode' } });

        const interviewTopics = InterviewTopicsSchema.parse(result);
        return { interviewTopics };
    };

/**
 * A synchronous node that builds the final report from all generated parts.
 * @param state - The current graph state containing all partial results.
 * @returns A partial state object with the final report.
 */
export const reportBuilderNode = (state: ReportingGraphState): { report: Report } => {
    const logger = new Logger('ReportBuilderNode');
    const traceId = (state as any).traceId;

    logger.log(`${chalk.blue('Builder Started')} ${chalk.green('for node:')} ${chalk.yellow('ReportBuilderNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)}`)

    if (!state.finalResult || !state.summary || !state.recommendations || !state.interviewTopics) {
        const errorMessage = 'Report builder received incomplete data.';
        logger.error({ traceId, message: errorMessage });
        throw new Error('Report builder received incomplete data.');
    }

    const {
        finalResult,
        summary,
        recommendations,
        interviewTopics,
    } = state as {
        finalResult: FinalResult;
        summary: Summary;
        recommendations: Recommendations;
        interviewTopics: InterviewTopics;
    };

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

    logger.log(`${chalk.blue('Builder Finished')} ${chalk.green('for node:')} ${chalk.yellow('ReportBuilderNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceId}`)}`)

    return { report: validatedReport };
};
