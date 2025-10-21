import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    // --- Track 1 ---
    createSummaryGenerateNode,
    validateSummaryNode,
    createFixSummaryNode,
    // --- Track 2 ---
    createRecommendationsGenerateNode,
    validateRecommendationsNode,
    createFixRecommendationsNode,
    // --- Track 3 ---
    createInterviewTopicsGenerateNode,
    validateInterviewTopicsNode,
    createFixInterviewTopicsNode,
    // --- Join/End ---
    reportBuilderNode,
    handleFailureNode
} from './reporting.nodes';
import { ReportingGraphStateAnnotation, ReportingGraphState } from "./reporting.state";

/**
 * Max number of retries for correction.
 */
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- Conditional Routers --------------------------------------------------------
// --------------------------------------------------------------------------------

const routerSummary = (state: ReportingGraphState) => {
    const error = (state as any).summaryError;
    const retries = (state as any).summaryRetries;
    if (!error) return 'reportBuilderNode';
    if (retries >= MAX_RETRIES) return 'handleFailureNode';
    return 'fixSummaryNode';
};

const routerRecommendations = (state: ReportingGraphState) => {
    const error = (state as any).recommendationsError;
    const retries = (state as any).recommendationsRetries;
    if (!error) return 'reportBuilderNode';
    if (retries >= MAX_RETRIES) return 'handleFailureNode';
    return 'fixRecommendationsNode';
};

const routerTopics = (state: ReportingGraphState) => {
    const error = (state as any).topicsError;
    const retries = (state as any).topicsRetries;
    if (!error) return 'reportBuilderNode';
    if (retries >= MAX_RETRIES) return 'handleFailureNode';
    return 'fixInterviewTopicsNode';
};

// --------------------------------------------------------------------------------
// --- Graph Definition -----------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a robust LangGraph subgraph for generating a final candidate report.
 *
 * @param llm - The ChatGoogleGenerativeAI model instance.
 * @returns A compiled LangGraph workflow.
 */
export const createReportingSubgraph = (llm: ChatGoogleGenerativeAI) => {
    // --- Initialize Nodes ---
    const summaryGenerateNode = createSummaryGenerateNode(llm);
    const fixSummaryNode = createFixSummaryNode(llm);
    const recommendationsGenerateNode = createRecommendationsGenerateNode(llm);
    const fixRecommendationsNode = createFixRecommendationsNode(llm);
    const interviewTopicsGenerateNode = createInterviewTopicsGenerateNode(llm);
    const fixInterviewTopicsNode = createFixInterviewTopicsNode(llm);

    const workflow = new StateGraph(ReportingGraphStateAnnotation)
        // --- Add all 11 nodes ---
        .addNode('summaryGenerateNode', summaryGenerateNode)
        .addNode('validateSummaryNode', validateSummaryNode)
        .addNode('fixSummaryNode', fixSummaryNode)

        .addNode('recommendationsGenerateNode', recommendationsGenerateNode)
        .addNode('validateRecommendationsNode', validateRecommendationsNode)
        .addNode('fixRecommendationsNode', fixRecommendationsNode)

        .addNode('interviewTopicsGenerateNode', interviewTopicsGenerateNode)
        .addNode('validateInterviewTopicsNode', validateInterviewTopicsNode)
        .addNode('fixInterviewTopicsNode', fixInterviewTopicsNode)

        .addNode('reportBuilderNode', reportBuilderNode)
        .addNode('handleFailureNode', handleFailureNode)

        // --- Entry Point (Fan-Out) ---
        .addEdge(START, 'summaryGenerateNode')
        .addEdge(START, 'recommendationsGenerateNode')
        .addEdge(START, 'interviewTopicsGenerateNode')

        // --- Track 1 (Summary) Logic ---
        .addEdge('summaryGenerateNode', 'validateSummaryNode')
        .addConditionalEdges('validateSummaryNode', routerSummary)
        .addEdge('fixSummaryNode', 'validateSummaryNode') // Loop

        // --- Track 2 (Recommendations) Logic ---
        .addEdge('recommendationsGenerateNode', 'validateRecommendationsNode')
        .addConditionalEdges('validateRecommendationsNode', routerRecommendations)
        .addEdge('fixRecommendationsNode', 'validateRecommendationsNode') // Loop

        // --- Track 3 (Topics) Logic ---
        .addEdge('interviewTopicsGenerateNode', 'validateInterviewTopicsNode')
        .addConditionalEdges('validateInterviewTopicsNode', routerTopics)
        .addEdge('fixInterviewTopicsNode', 'validateInterviewTopicsNode') // Loop

        // --- Exit Points (Fan-In) ---
        .addEdge('reportBuilderNode', END)
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
