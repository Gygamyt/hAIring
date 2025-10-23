import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createTopicExtractorGenerateNode,
    validateTopicExtractorNode,
    createFixTopicExtractorNode,
    handleTopicExtractorFailureNode,
} from './topic-extractor.nodes';
import {
    TopicExtractorStateAnnotation,
    TopicExtractorState,
} from './topic-extractor.state';

/** Max number of retries for correction (1 initial attempt + 2 fixes). */
const MAX_RETRIES = 2;

// --- Conditional Router ---
const router = (state: TopicExtractorState) => {
    // Use type assertion as TS might lose type info
    const error = state.topicsError as string | null;
    const retries = state.topicsRetries as number | null;

    if (!error) {
        // 1. Success -> End this subgraph successfully
        return END;
    }
    if (retries !== null && retries >= MAX_RETRIES) {
        // 2. Failure (limit reached) -> Go to failure handler
        return 'handleFailureNode';
    }
    // 3. Error, but retries left -> Go to fixer node
    return 'fixTopicExtractorNode';
};

// --- Graph Definition ---
/**
 * Creates a robust LangGraph subgraph for extracting interview topics.
 * Implements a Generate -> Validate -> Fix (with Retries) pattern.
 *
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns A compiled StateGraph workflow for topic extraction.
 */
export const createTopicExtractorSubgraph = (llm: ChatGoogleGenerativeAI) => {
    // --- Initialize Nodes ---
    const topicExtractorGenerateNode = createTopicExtractorGenerateNode(llm);
    const fixTopicExtractorNode = createFixTopicExtractorNode(llm);

    const workflow = new StateGraph(TopicExtractorStateAnnotation)
        // --- Add Nodes ---
        .addNode('topicExtractorGenerateNode', topicExtractorGenerateNode)
        .addNode('validateTopicExtractorNode', validateTopicExtractorNode) // Sync node
        .addNode('fixTopicExtractorNode', fixTopicExtractorNode)
        .addNode('handleFailureNode', handleTopicExtractorFailureNode) // Sync node

        // --- Define Edges ---
        // 1. Start -> Generate
        .addEdge(START, 'topicExtractorGenerateNode')
        // 2. Generate -> Validate
        .addEdge('topicExtractorGenerateNode', 'validateTopicExtractorNode')
        // 3. Validate -> Router (Conditional Edges)
        .addConditionalEdges('validateTopicExtractorNode', router)
        // 4. Fix -> Validate (Retry Loop)
        .addEdge('fixTopicExtractorNode', 'validateTopicExtractorNode')
        // 5. Failure Handler -> End
        .addEdge('handleFailureNode', END);
    // Success path from router goes directly to END

    // --- Compile ---
    return workflow.compile();
};
