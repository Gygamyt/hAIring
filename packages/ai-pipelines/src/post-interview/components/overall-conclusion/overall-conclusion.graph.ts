import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createOverallConclusionGenerateNode,
    validateOverallConclusionNode,
    createOverallConclusionFixNode,
    handleFailureNode,
    routerForOverallConclusion,
} from './overall-conclusion.nodes';
import {
    OverallConclusionStateAnnotation,

} from './overall-conclusion.state';

/**
 * Creates a robust LangGraph subgraph for generating the overall conclusion.
 *
 * This workflow implements a "Generate -> Validate -> Fix (with Retries)" loop.
 *
 * 1. `generateNode`: Attempts to synthesize all inputs into a final recommendation.
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
export const createOverallConclusionSubgraph = (
    llm: ChatGoogleGenerativeAI,
) => {
    const generateNode = createOverallConclusionGenerateNode(llm);
    const fixNode = createOverallConclusionFixNode(llm);

    const workflow = new StateGraph(OverallConclusionStateAnnotation,)
        .addNode('generateNode', generateNode)
        .addNode('validateNode', validateOverallConclusionNode)
        .addNode('fixNode', fixNode)
        .addNode('handleFailureNode', handleFailureNode);

    workflow
        // --- Entry Point ---
        .addEdge(START, 'generateNode')

        // --- Main Loop ---
        .addEdge('generateNode', 'validateNode')
        .addConditionalEdges('validateNode', routerForOverallConclusion, {
            success: END,
            failure: 'handleFailureNode',
            fix: 'fixNode',
        })
        .addEdge('fixNode', 'validateNode')

        // --- Exit Point ---
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
