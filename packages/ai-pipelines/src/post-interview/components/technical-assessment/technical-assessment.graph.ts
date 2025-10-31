import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createTechnicalAssessmentGenerateNode,
    validateTechnicalAssessmentNode,
    createTechnicalAssessmentFixNode,
    handleFailureNode,
    routerForTechnicalAssessment,
} from './technical-assessment.nodes';
import {
    TechnicalAssessmentStateAnnotation,
    ITechnicalAssessmentState,
} from './technical-assessment.state';

/**
 * Creates a robust LangGraph subgraph for analyzing technical assessment.
 *
 * This workflow implements a "Generate -> Validate -> Fix (with Retries)" loop.
 *
 * 1. `generateNode`: Attempts to parse the transcript for technical skills.
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
export const createTechnicalAssessmentSubgraph = (
    llm: ChatGoogleGenerativeAI,
) => {
    const generateNode = createTechnicalAssessmentGenerateNode(llm);
    const fixNode = createTechnicalAssessmentFixNode(llm);

    const workflow = new StateGraph(TechnicalAssessmentStateAnnotation,)
        .addNode('generateNode', generateNode)
        .addNode('validateNode', validateTechnicalAssessmentNode)
        .addNode('fixNode', fixNode)
        .addNode('handleFailureNode', handleFailureNode);

    workflow
        // --- Entry Point ---
        .addEdge(START, 'generateNode')

        // --- Main Loop ---
        .addEdge('generateNode', 'validateNode')
        // @ts-expect-error todo check
        .addConditionalEdges('validateNode', routerForTechnicalAssessment, {
            success: END,
            failure: 'handleFailureNode',
            fix: 'fixNode',
        })
        .addEdge('fixNode', 'validateNode')

        // --- Exit Point ---
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
