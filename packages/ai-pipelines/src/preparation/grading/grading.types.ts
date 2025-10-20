import { z } from "zod";
import { AggregatedDataSchema } from "../parsing/parsing.state";

/**
 * Schema for the output of the grade and type determination node.
 */
export const GradeAndTypeSchema = z.object({
    grade: z.enum(['Trainee', 'Junior', 'Middle', 'Senior']),
    type: z.enum(['QA', 'AQA']),
});

/**
 * Schema for a single criterion match.
 */
const CriterionMatchSchema = z.object({
    criterion: z.string(),
    match: z.enum(['full', 'partial', 'none']),
    comment: z.string(),
});

/**
 * Schema for the output of the criteria matching node.
 * It's an array of criterion matches.
 */
export const CriteriaMatchingSchema = z.array(CriterionMatchSchema);

/**
 * Schema for the output of the values assessment node.
 */
export const ValuesAssessmentSchema = z.object({
    values_assessment: z.string(),
});

/**
 * Schema for the final, combined assessment object.
 * This structure will be added to the initial aggregated data.
 */
export const AssessmentSchema = z.object({
    grade: z.string(),
    type: z.string(),
    criteria_matching: CriteriaMatchingSchema,
    values_assessment: z.string(),
});

/**
 * Schema for the final result, combining original data with the new assessment.
 */
export const FinalResultSchema = AggregatedDataSchema.extend({
    assessment: AssessmentSchema,
});

export type FinalResult = z.infer<typeof FinalResultSchema>;
export type GradeAndType = z.infer<typeof GradeAndTypeSchema>;
export type CriteriaMatching = z.infer<typeof CriteriaMatchingSchema>;
export type ValuesAssessment = z.infer<typeof ValuesAssessmentSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
