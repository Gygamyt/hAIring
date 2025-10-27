import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from "../../utils";
import { AggregatedData, CvData, FeedbackData, RequirementsData } from "./parsing.types";

/**
 * Defines the complete state for the parsing graph using LangGraph's Annotation API.
 * This centralized definition ensures type safety across all nodes.
 */
export const PreparationGraphStateAnnotation = Annotation.Root({
    traceId: Annotation<string | null>(),

    cvText: Annotation<string | null>(),
    requirementsText: Annotation<string | null>(),
    feedbackText: Annotation<string | null>(),

    parsedCv: Annotation<CvData | null>(),
    parsedRequirements: Annotation<RequirementsData | null>(),
    parsedFeedback: Annotation<FeedbackData | null>(),

    aggregatedResult: Annotation<AggregatedData | null>(),

    rawCv: Annotation<string | null>(),
    cvError: Annotation<string | null>(),
    cvRetries: Annotation<number | null>(),

    rawRequirements: Annotation<string | null>(),
    requirementsError: Annotation<string | null>(),
    requirementsRetries: Annotation<number | null>(),

    rawFeedback: Annotation<string | null>(),
    feedbackError: Annotation<string | null>(),
    feedbackRetries: Annotation<number | null>(),

    graphError: Annotation<string | null>(),
});

/**
 * The compiled TypeScript type for the graph's state.
 */
export type PreparationGraphState = InferGraphState<typeof PreparationGraphStateAnnotation>;
