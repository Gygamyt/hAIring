import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createCandidateInfoSummaryGenerateNode,
    validateCandidateInfoSummaryNode,
    createCandidateInfoSummaryFixNode,
    handleFailureNode,
    routerForCandidateInfoSummary,
} from './candidate-info-summary.nodes';
import {
    CandidateInfoSummaryStateAnnotation,
    ICandidateInfoSummaryState,
} from './candidate-info-summary.state';

/**
 * Creates a robust LangGraph subgraph for parsing a CV.
 *
 * This workflow implements a "Generate -> Validate -> Fix (with Retries)" loop.
 *
 * 1. `generateNode`: Attempts to parse the CV text.
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
export const createCandidateInfoSummarySubgraph = (
    llm: ChatGoogleGenerativeAI,
) => {
    const generateNode = createCandidateInfoSummaryGenerateNode(llm);
    const fixNode = createCandidateInfoSummaryFixNode(llm);

    const workflow = new StateGraph(CandidateInfoSummaryStateAnnotation,)
        .addNode('generateNode', generateNode)
        .addNode('validateNode', validateCandidateInfoSummaryNode)
        .addNode('fixNode', fixNode)
        .addNode('handleFailureNode', handleFailureNode);

    workflow
        // --- Entry Point ---
        .addEdge(START, 'generateNode')

        // --- Main Loop ---
        .addEdge('generateNode', 'validateNode')
        .addConditionalEdges('validateNode', routerForCandidateInfoSummary, {
            success: END,
            failure: 'handleFailureNode',
            fix: 'fixNode',
        })
        .addEdge('fixNode', 'validateNode')

        // --- Exit Point ---
        .addEdge('handleFailureNode', END);

    // 4. Compile and return
    return workflow.compile();
};
