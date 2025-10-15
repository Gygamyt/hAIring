import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { aggregatorNode, createCvParserNode, createFeedbackParserNode, createRequirementsParserNode } from "./parsing.nodes";
import { PreparationGraphStateAnnotation } from "./parsing.state";

/**
 * Creates a LangGraph subgraph for parallel parsing of CV, requirements, and feedback documents.
 *
 * This function implements a fan-out/fan-in pattern where three parser nodes execute in parallel,
 * followed by an aggregator node that combines their results. The graph structure ensures:
 * - Parallel execution of independent parsing tasks for optimal performance
 * - Synchronization before aggregation (aggregator waits for all parsers to complete)
 * - Type-safe node definitions using method chaining
 *
 * @param llm - Google Generative AI chat model instance used by parser nodes for LLM-based parsing
 *
 * @returns A compiled LangGraph workflow ready for execution
 *
 * @example
 * ```
 * const llm = new ChatGoogleGenerativeAI({ modelName: 'gemini-pro' });
 * const parsingGraph = createParsingSubgraph(llm);
 *
 * const result = await parsingGraph.invoke({
 *   cvText: 'John Doe, Software Engineer...',
 *   requirementsText: 'Required: 5+ years experience...',
 *   feedbackText: 'Strong technical skills...'
 * });
 * ```
 *
 * @remarks
 * Graph structure:
 * ```
 *           START
 *          / | \
 *         /  |  \
 *   cvParser requirementsParser feedbackParser (parallel execution)
 *         \  |  /
 *          \ | /
 *        aggregator
 *            |
 *           END
 * ```
 *
 * The parallel execution occurs in a single "superstep" where all three parsers
 * run concurrently. The aggregator node is only invoked after all parser nodes
 * have completed their execution, ensuring all parsed data is available for aggregation.
 *
 * @see {@link PreparationGraphStateAnnotation} for state schema definition
 * @see {@link https://langchain-ai.github.io/langgraphjs/how-tos/branching/|LangGraph Branching Documentation}
 */
export const createParsingSubgraph = (llm: ChatGoogleGenerativeAI) => {
    const cvParserNode = createCvParserNode(llm);
    const requirementsParserNode = createRequirementsParserNode(llm);
    const feedbackParserNode = createFeedbackParserNode(llm);

    const workflow = new StateGraph(PreparationGraphStateAnnotation)
        .addNode('cvParser', cvParserNode)
        .addNode('requirementsParser', requirementsParserNode)
        .addNode('feedbackParser', feedbackParserNode)
        .addNode('aggregator', aggregatorNode)
        .addEdge(START, 'cvParser')
        .addEdge(START, 'requirementsParser')
        .addEdge(START, 'feedbackParser')
        .addEdge(['cvParser', 'requirementsParser', 'feedbackParser'], 'aggregator')
        .addEdge('aggregator', END);

    return workflow.compile();
};
