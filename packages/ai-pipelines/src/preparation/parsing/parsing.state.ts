import { Annotation } from "@langchain/langgraph";

export const PreparationGraphStateAnnotation = Annotation.Root({
    cvText: Annotation<string>,
    requirementsText: Annotation<string>,
    feedbackText: Annotation<string>,

    parsedCv: Annotation<any>,
    parsedRequirements: Annotation<any>,
    parsedFeedback: Annotation<any>,

    aggregatedResult: Annotation<any>,
});
