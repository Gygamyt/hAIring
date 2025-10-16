import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import {
    gradeAndTypePrompt,
    criteriaMatchingPrompt,
    valuesAssessmentPrompt,
} from './grading.prompts';
import {
    GradeAndTypeSchema,
    CriteriaMatchingSchema,
    ValuesAssessmentSchema,
    AssessmentSchema, GradeAndType, CriteriaMatching, ValuesAssessment, FinalResult,
} from './grading.state';
import type { GradingGraphState } from './grading.state';
import type { Assessment } from './grading.state';
import { AggregatedData } from "../parsing/parsing.state";

/**
 * Creates a node to determine the candidate's grade and type.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the state and returns the parsed grade and type.
 */
export const createGradeAndTypeNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        console.log('--- 🤖 Executing Node: Grade & Type ---');

        const aggregatedResult = state.aggregatedResult as AggregatedData;
        if (!aggregatedResult) {
            throw new Error("Input 'aggregatedResult' is missing from the state.");
        }

        const chain = gradeAndTypePrompt.pipe(llm).pipe(new JsonOutputParser());

        const result = await chain.invoke({
            candidateInfo: JSON.stringify(aggregatedResult?.candidate_info),
            jobRequirements: JSON.stringify(aggregatedResult?.job_requirements),
        });

        const gradeAndType = GradeAndTypeSchema.parse(result);
        return { gradeAndType };
    };

/**
 * Creates a node to perform detailed criteria matching.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the state and returns the criteria matching array.
 */
export const createCriteriaMatchingNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        console.log('--- 🤖 Executing Node: Criteria Matching ---');
        const aggregatedResult = state.aggregatedResult as AggregatedData;
        if (!aggregatedResult) {
            throw new Error("Input 'aggregatedResult' is missing from the state.");
        }

        const chain = criteriaMatchingPrompt.pipe(llm).pipe(new JsonOutputParser());

        const result = await chain.invoke({
            candidateInfo: JSON.stringify(aggregatedResult?.candidate_info),
            jobRequirements: JSON.stringify(aggregatedResult?.job_requirements),
            recruiterFeedback: JSON.stringify(aggregatedResult?.recruiter_feedback),
        });

        const criteriaMatching = CriteriaMatchingSchema.parse(result);
        return { criteriaMatching };
    };

/**
 * Creates a node to assess the candidate's alignment with values.
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns An async function that takes the state and returns the values assessment.
 */
export const createValuesAssessmentNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: GradingGraphState): Promise<Partial<GradingGraphState>> => {
        console.log('--- 🤖 Executing Node: Values Assessment ---');
        const aggregatedResult = state.aggregatedResult as AggregatedData;
        if (!aggregatedResult) {
            throw new Error("Input 'aggregatedResult' is missing from the state.");
        }

        const chain = valuesAssessmentPrompt.pipe(llm).pipe(new JsonOutputParser());

        const result = await chain.invoke({
            softSkillsRequired: JSON.stringify(aggregatedResult?.job_requirements.soft_skills_required),
            recruiterFeedback: JSON.stringify(aggregatedResult?.recruiter_feedback),
        });

        const valuesAssessment = ValuesAssessmentSchema.parse(result);
        return { valuesAssessment };
    };

/**
 * A synchronous node that aggregates all assessment results into a final structure.
 * It combines the initial data with the new 'assessment' object.
 * @param state - The current graph state containing all partial results.
 * @returns A partial state object with the final result.
 */
export const assessmentAggregatorNode = (state: GradingGraphState): { finalResult: FinalResult } => {
    console.log('--- 🖇️ Executing Node: Assessment Aggregator ---');

    if (!state.aggregatedResult || !state.gradeAndType || !state.criteriaMatching || !state.valuesAssessment) {
        throw new Error('Assessment aggregator received incomplete data.');
    }

    const {
        aggregatedResult,
        gradeAndType,
        criteriaMatching,
        valuesAssessment
    } = state as {
        aggregatedResult: AggregatedData;
        gradeAndType: GradeAndType;
        criteriaMatching: CriteriaMatching;
        valuesAssessment: ValuesAssessment;
    };

    const assessment: Assessment = {
        grade: gradeAndType.grade,
        type: gradeAndType.type,
        criteria_matching: criteriaMatching,
        values_assessment: valuesAssessment.values_assessment,
    };

    const finalResult: FinalResult = {
        ...aggregatedResult,
        assessment: AssessmentSchema.parse(assessment),
    };

    return { finalResult };
};
