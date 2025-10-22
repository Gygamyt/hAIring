import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createLanguageAssessmentGenerateNode,
    validateLanguageAssessmentNode,
    createLanguageAssessmentFixNode,
    handleFailureNode,
    routerForLanguageAssessment,
} from './language-assessment.nodes';
import {
    LanguageAssessmentStateAnnotation,
    ILanguageAssessmentState,
} from './language-assessment.state';

/**
 * Creates a robust LangGraph subgraph for analyzing language assessment.
 *
 * This workflow implements a "Generate -> Validate -> Fix (with Retries)" loop.
 *
 * 1. `generateNode`: Attempts to parse the transcript for language skills.
 * 2. `validateNode`: Checks the raw output against the Zod schema.
 * 3. `router`:
 * - On success: Routes to END.
 * - On failure (with retries left): Routes to `fixNode`.
 * - On failure (no retries left): Routes to `handleFailureNode`.
 * 4. `fixNode`: Attempts to correct the error.
 * 5. `handleFailureNode`: Terminates the graph and logs the final error.
 *
 * @param llm - Google Generative AI chat model instance.
 * @returns A compiled LangGraph workflow.
 */
export const createLanguageAssessmentSubgraph = (
    llm: ChatGoogleGenerativeAI,
) => {
    const generateNode = createLanguageAssessmentGenerateNode(llm);
    const fixNode = createLanguageAssessmentFixNode(llm);

    const workflow = new StateGraph(
        LanguageAssessmentStateAnnotation,
    )
        .addNode('generateNode', generateNode)
        .addNode('validateNode', validateLanguageAssessmentNode)
        .addNode('fixNode', fixNode)
        .addNode('handleFailureNode', handleFailureNode);

    workflow
        // --- Entry Point ---
        .addEdge(START, 'generateNode')

        // --- Main Loop ---
        .addEdge('generateNode', 'validateNode')
        .addConditionalEdges('validateNode', routerForLanguageAssessment, {
            success: END,
            failure: 'handleFailureNode',
            fix: 'fixNode',
        })
        .addEdge('fixNode', 'validateNode')

        // --- Exit Point ---
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
