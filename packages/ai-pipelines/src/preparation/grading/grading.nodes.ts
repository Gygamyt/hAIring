import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    gradeAndTypePrompt,
    criteriaMatchingPrompt,
    valuesAssessmentPrompt,
    fixGradeAndTypePrompt,
    fixCriteriaMatchingPrompt,
    fixValuesAssessmentPrompt,
} from './grading.prompts';
import type { GradingGraphState } from './grading.state';
import { AggregatedData } from "../parsing/parsing.state";
import { Logger } from '@nestjs/common';
import chalk from "chalk";
import { v4 as uuidv4 } from 'uuid';
import { getRawContent, validateAndParse } from '../../utils';
import {
    Assessment,
    AssessmentSchema,
    CriteriaMatching,
    CriteriaMatchingSchema,
    FinalResult, FinalResultSchema,
    GradeAndType,
    GradeAndTypeSchema,
    ValuesAssessment,
    ValuesAssessmentSchema
} from "./grading.types";

// --------------------------------------------------------------------------------
// --- Logger Initialization ------------------------------------------------------
// --------------------------------------------------------------------------------

const logger = new Logger('GradingNodes');

// --------------------------------------------------------------------------------
// --- TRACK 1: Grade & Type ------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to generate the initial "Grade and Type" assessment.
 * This node invokes the LLM, initializes retry counters, and sets the traceID.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the current state and returns the raw LLM output
 * and initialized state fields.
 */
export const createGradeAndTypeGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        const traceID = uuidv4();
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('GradeAndTypeGenerateNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        const aggregatedResult = state.aggregatedResult as AggregatedData;
        const chain = gradeAndTypePrompt.pipe(llm);
        const result = await chain.invoke({
            candidateInfo: JSON.stringify(aggregatedResult?.candidate_info),
            jobRequirements: JSON.stringify(aggregatedResult?.job_requirements),
        }, { metadata: { node: 'GradeAndTypeGenerateNode' } });
        logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('GradeAndTypeGenerateNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        return {
            rawGradeAndType: getRawContent(result, logger),
            traceID,
            gradeAndTypeRetries: 0,
            criteriaMatchingRetries: 0,
            valuesAssessmentRetries: 0,
            graphError: null,
        };
    };

/**
 * A synchronous node to validate the raw JSON output from the "Grade and Type" generation.
 * It uses a Zod schema to parse the JSON.
 * - On success: Returns the parsed `gradeAndType` object.
 * - On failure: Returns a formatted `gradeAndTypeError` message and increments the retry counter.
 * @param state - The current graph state.
 * @returns An object with either the parsed data or an error and incremented retry count.
 */
export const validateGradeAndTypeNode = (
    state: GradingGraphState
): { gradeAndType?: GradeAndType | null; gradeAndTypeError?: string | null; gradeAndTypeRetries?: number } => {
    const { data, error } = validateAndParse(
        state.rawGradeAndType as string | null,
        GradeAndTypeSchema
    );
    if (error) {
        return {
            gradeAndTypeError: error,
            gradeAndTypeRetries: (state.gradeAndTypeRetries as number ?? 0) + 1
        };
    }
    return { gradeAndType: data, gradeAndTypeError: null };
};

/**
 * Creates a node to "fix" an invalid "Grade and Type" JSON output.
 * This node invokes the LLM with the previous raw output and the specific validation error.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the current state and returns a new raw LLM output.
 */
export const createFixGradeAndTypeNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        const traceID = state.traceID as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixGradeAndTypeNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        const chain = fixGradeAndTypePrompt.pipe(llm);
        const result = await chain.invoke({
            error: state.gradeAndTypeError,
            rawOutput: state.rawGradeAndType,
        }, { metadata: { node: 'FixGradeAndTypeNode' } });
        logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixGradeAndTypeNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        return { rawGradeAndType: getRawContent(result, logger) };
    };

// --------------------------------------------------------------------------------
// --- TRACK 2: Criteria Matching -------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to generate the initial "Criteria Matching" assessment.
 * This node invokes the LLM to compare candidate data against job requirements.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the current state and returns the raw LLM output.
 */
export const createCriteriaMatchingGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        const traceID = state.traceID as string;
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('CriteriaMatchingGenerateNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        const aggregatedResult = state.aggregatedResult as AggregatedData;
        const chain = criteriaMatchingPrompt.pipe(llm);
        const result = await chain.invoke({
            candidateInfo: JSON.stringify(aggregatedResult?.candidate_info),
            jobRequirements: JSON.stringify(aggregatedResult?.job_requirements),
            recruiterFeedback: JSON.stringify(aggregatedResult?.recruiter_feedback),
        }, { metadata: { node: 'CriteriaMatchingGenerateNode' } });
        logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('CriteriaMatchingGenerateNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        return { rawCriteriaMatching: getRawContent(result, logger) };
    };

/**
 * A synchronous node to validate the raw JSON output from "Criteria Matching" generation.
 * It uses a Zod schema to parse the JSON array.
 * - On success: Returns the parsed `criteriaMatching` array.
 * - On failure: Returns a formatted `criteriaMatchingError` message and increments the retry counter.
 * @param state - The current graph state.
 * @returns An object with either the parsed data or an error and incremented retry count.
 */
export const validateCriteriaMatchingNode = (
    state: GradingGraphState
): { criteriaMatching?: CriteriaMatching | null; criteriaMatchingError?: string | null; criteriaMatchingRetries?: number } => {
    const traceID = state.traceID as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateGradeAndTypeNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
    const { data, error } = validateAndParse(
        state.rawCriteriaMatching as string | null,
        CriteriaMatchingSchema
    );
    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateGradeAndTypeNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)} ${chalk.red('Error:')} ${error}`);
        return {
            criteriaMatchingError: error,
            criteriaMatchingRetries: (state.criteriaMatchingRetries as number ?? 0) + 1
        };
    }
    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateGradeAndTypeNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
    return { criteriaMatching: data, criteriaMatchingError: null };
};

/**
 * Creates a node to "fix" an invalid "Criteria Matching" JSON output.
 * This node invokes the LLM with the previous raw output and the specific validation error.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the current state and returns a new raw LLM output.
 */
export const createFixCriteriaMatchingNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        const traceID = state.traceID as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixCriteriaMatchingNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        const chain = fixCriteriaMatchingPrompt.pipe(llm);
        const result = await chain.invoke({
            error: state.criteriaMatchingError,
            rawOutput: state.rawCriteriaMatching,
        }, { metadata: { node: 'FixCriteriaMatchingNode' } });
        logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixCriteriaMatchingNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        return { rawCriteriaMatching: getRawContent(result, logger) };
    };

// --------------------------------------------------------------------------------
// --- TRACK 3: Values Assessment -------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a node to generate the initial "Values Assessment".
 * This node invokes the LLM to assess cultural fit based on soft skills and feedback.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the current state and returns the raw LLM output.
 */
export const createValuesAssessmentGenerateNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        const traceID = state.traceID as string;
        logger.log(`${chalk.blue('Node Started')} ${chalk.green('for node:')} ${chalk.yellow('ValuesAssessmentGenerateNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        const aggregatedResult = state.aggregatedResult as AggregatedData;
        const chain = valuesAssessmentPrompt.pipe(llm);
        const result = await chain.invoke({
            softSkillsRequired: JSON.stringify(aggregatedResult?.job_requirements.soft_skills_required),
            recruiterFeedback: JSON.stringify(aggregatedResult?.recruiter_feedback),
        }, { metadata: { node: 'ValuesAssessmentGenerateNode' } });
        logger.log(`${chalk.cyan('Node Finished')} ${chalk.green('for node:')} ${chalk.yellow('ValuesAssessmentGenerateNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        return { rawValuesAssessment: getRawContent(result, logger) };
    };

/**
 * A synchronous node to validate the raw JSON output from "Values Assessment" generation.
 * It uses a Zod schema to parse the JSON.
 * - On success: Returns the parsed `valuesAssessment` object.
 * - On failure: Returns a formatted `valuesAssessmentError` message and increments the retry counter.
 * @param state - The current graph state.
 * @returns An object with either the parsed data or an error and incremented retry count.
 */
export const validateValuesAssessmentNode = (
    state: GradingGraphState
): { valuesAssessment?: ValuesAssessment | null; valuesAssessmentError?: string | null; valuesAssessmentRetries?: number } => {
    const traceID = state.traceID as string;
    logger.log(`${chalk.blue('Node Validating')} ${chalk.green('for node:')} ${chalk.yellow('validateValuesAssessmentNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
    const { data, error } = validateAndParse(
        state.rawValuesAssessment as string | null,
        ValuesAssessmentSchema
    );
    if (error) {
        logger.warn(`${chalk.yellow('Node Validated (Error)')} ${chalk.green('for node:')} ${chalk.yellow('validateValuesAssessmentNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)} ${chalk.red('Error:')} ${error}`);
        return {
            valuesAssessmentError: error,
            valuesAssessmentRetries: (state.valuesAssessmentRetries as number ?? 0) + 1
        };
    }
    logger.log(`${chalk.cyan('Node Validated (Success)')} ${chalk.green('for node:')} ${chalk.yellow('validateValuesAssessmentNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
    return { valuesAssessment: data, valuesAssessmentError: null };
};

/**
 * Creates a node to "fix" an invalid "Values Assessment" JSON output.
 * This node invokes the LLM with the previous raw output and the specific validation error.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the current state and returns a new raw LLM output.
 */
export const createFixValuesAssessmentNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        const traceID = state.traceID as string;
        logger.log(`${chalk.blue('Node Started (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixValuesAssessmentNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        const chain = fixValuesAssessmentPrompt.pipe(llm);
        const result = await chain.invoke({
            error: state.valuesAssessmentError,
            rawOutput: state.rawValuesAssessment,
        }, { metadata: { node: 'FixValuesAssessmentNode' } });
        logger.log(`${chalk.cyan('Node Finished (Fixing)')} ${chalk.green('for node:')} ${chalk.yellow('FixValuesAssessmentNode')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
        return { rawValuesAssessment: getRawContent(result, logger) };
    };

// --------------------------------------------------------------------------------
// --- AGGREGATION & COMPLETION ---------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * A synchronous node that aggregates all successful parallel tracks into a final result.
 * It checks if all required data (`gradeAndType`, `criteriaMatching`, `valuesAssessment`) is present.
 * - On success: Returns the compiled `finalResult` object.
 * - On failure: Returns a `graphError` indicating what data was missing.
 * @param state - The current graph state containing all partial results.
 * @returns A partial state object with either the `finalResult` or a `graphError`.
 */
export const assessmentAggregatorNode = (state: GradingGraphState): { finalResult: FinalResult | null; graphError: string | null } => {
    const traceID = state.traceID as string;
    logger.log(`${chalk.blue('Aggregator Started')} ${chalk.green('for node:')} ${chalk.yellow('GradingAggregator')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);

    const aggregatedResult = state.aggregatedResult as AggregatedData | null;
    const gradeAndType = state.gradeAndType as GradeAndType | null;
    const criteriaMatching = state.criteriaMatching as CriteriaMatching | null;
    const valuesAssessment = state.valuesAssessment as ValuesAssessment | null;

    if (!aggregatedResult || !gradeAndType || !criteriaMatching || !valuesAssessment) {
        const missing = [
            !gradeAndType ? 'gradeAndType' : null,
            !criteriaMatching ? 'criteriaMatching' : null,
            !valuesAssessment ? 'valuesAssessment' : null,
        ].filter(Boolean).join(', ');

        logger.error(`Aggregator failed: missing data for [${missing}]. TraceID: ${traceID}`);
        return {
            finalResult: null,
            graphError: `Aggregator failed: missing data for [${missing}].`
        };
    }

    const assessment: Assessment = {
        grade: gradeAndType.grade,
        type: gradeAndType.type,
        criteria_matching: criteriaMatching,
        values_assessment: valuesAssessment.values_assessment,
    };

    const finalResult: FinalResult = {
        ...(aggregatedResult as AggregatedData),
        assessment: AssessmentSchema.parse(assessment),
    };

    logger.log(`${chalk.cyan('Aggregator Finished')} ${chalk.green('for node:')} ${chalk.yellow('GradingAggregator')} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
    return { finalResult: FinalResultSchema.parse(finalResult), graphError: null };
};

/**
 * A synchronous node that handles terminal failures (e.g., when max retries are exceeded).
 * It logs the specific error that caused the pipeline to fail and sets a final `graphError`.
 * @param state - The current graph state containing the error message.
 * @returns A partial state object with the final `graphError`.
 */
export const handleFailureNode = (state: GradingGraphState): { graphError: string } => {
    const traceID = state.traceID as string;
    let finalError = "Grading pipeline failed after all retries.";

    if (state.gradeAndTypeError) finalError = `Failed on Grade/Type: ${state.gradeAndTypeError}`;
    if (state.criteriaMatchingError) finalError = `Failed on Criteria Matching: ${state.criteriaMatchingError}`;
    if (state.valuesAssessmentError) finalError = `Failed on Values Assessment: ${state.valuesAssessmentError}`;

    logger.error(`${chalk.red(finalError)} ${chalk.green('|')} ${chalk.yellow(`TraceID: ${traceID}`)}`);
    return { graphError: finalError };
};
