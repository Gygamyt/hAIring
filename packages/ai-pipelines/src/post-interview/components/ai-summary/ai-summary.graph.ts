import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createAiSummaryGenerateNode,
    validateAiSummaryNode,
    createAiSummaryFixNode,
    handleFailureNode,
    routerForAiSummary,
} from './ai-summary.nodes';
import {
    AiSummaryStateAnnotation,
} from './ai-summary.state';

/**
 * Creates a robust LangGraph subgraph for generating an AI summary.
 *
 * This workflow implements a "Generate -> Validate -> Fix (with Retries)" loop.
 *
 * 1. `generateNode`: Attempts to parse the transcript for a high-level summary.
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
export const createAiSummarySubgraph = (
    llm: ChatGoogleGenerativeAI,
) => {
    const generateNode = createAiSummaryGenerateNode(llm);
    const fixNode = createAiSummaryFixNode(llm);

    const workflow = new StateGraph(AiSummaryStateAnnotation,)
        .addNode('generateNode', generateNode)
        .addNode('validateNode', validateAiSummaryNode)
        .addNode('fixNode', fixNode)
        .addNode('handleFailureNode', handleFailureNode);

    workflow
        // --- Entry Point ---
        .addEdge(START, 'generateNode')

        // --- Main Loop ---
        .addEdge('generateNode', 'validateNode')
        .addConditionalEdges('validateNode', routerForAiSummary, {
            success: END,
            failure: 'handleFailureNode',
            fix: 'fixNode',
        })
        .addEdge('fixNode', 'validateNode')

        // --- Exit Point ---
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
