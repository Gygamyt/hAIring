import { Annotation } from "@langchain/langgraph";
import { InferGraphState } from "../../utils";
import { CriteriaMatching, FinalResult, GradeAndType, ValuesAssessment } from "./grading.types";
import { AggregatedData } from "../parsing/parsing.types";


/**
 * The LangGraph SCHEMA DEFINITION for the grading graph.
 */
export const GradingGraphStateAnnotation = Annotation.Root({
    traceID: Annotation<string | null>(),
    aggregatedResult: Annotation<AggregatedData | null>(),

    gradeAndType: Annotation<GradeAndType | null>(),
    criteriaMatching: Annotation<CriteriaMatching | null>(),
    valuesAssessment: Annotation<ValuesAssessment | null>(),

    rawGradeAndType: Annotation<string | null>(),
    gradeAndTypeError: Annotation<string | null>(),
    gradeAndTypeRetries: Annotation<number | null>(),

    rawCriteriaMatching: Annotation<string | null>(),
    criteriaMatchingError: Annotation<string | null>(),
    criteriaMatchingRetries: Annotation<number | null>(),

    rawValuesAssessment: Annotation<string | null>(),
    valuesAssessmentError: Annotation<string | null>(),
    valuesAssessmentRetries: Annotation<number | null>(),

    finalResult: Annotation<FinalResult | null>(),

    graphError: Annotation<string | null>(),
});

/**
 * The TypeScript data type for the grading graph's state.
 */
export type GradingGraphState = InferGraphState<typeof GradingGraphStateAnnotation>;
