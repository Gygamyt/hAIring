import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createCommunicationSkillsGenerateNode,
    validateCommunicationSkillsNode,
    createCommunicationSkillsFixNode,
    handleFailureNode,
    routerForCommunicationSkills,
} from './communication-skills.nodes';
import {
    CommunicationSkillsStateAnnotation,
    ICommunicationSkillsState,
} from './communication-skills.state';

/**
 * Creates a robust LangGraph subgraph for analyzing communication skills.
 *
 * This workflow implements a "Generate -> Validate -> Fix (with Retries)" loop.
 *
 * 1. `generateNode`: Attempts to parse the transcript.
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
export const createCommunicationSkillsSubgraph = (
    llm: ChatGoogleGenerativeAI,
) => {
    const generateNode = createCommunicationSkillsGenerateNode(llm);
    const fixNode = createCommunicationSkillsFixNode(llm);

    const workflow = new StateGraph(CommunicationSkillsStateAnnotation,)
        .addNode('generateNode', generateNode)
        .addNode('validateNode', validateCommunicationSkillsNode)
        .addNode('fixNode', fixNode)
        .addNode('handleFailureNode', handleFailureNode);

    workflow
        // --- Entry Point ---
        .addEdge(START, 'generateNode')

        // --- Main Loop ---
        .addEdge('generateNode', 'validateNode')
        .addConditionalEdges('validateNode', routerForCommunicationSkills, {
            success: END,
            failure: 'handleFailureNode',
            fix: 'fixNode',
        })
        .addEdge('fixNode', 'validateNode')

        // --- Exit Point ---
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
