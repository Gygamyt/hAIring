import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createSummaryNode,
    createRecommendationsNode,
    createInterviewTopicsNode,
    reportBuilderNode,
} from './reporting.nodes';
import { ReportingGraphStateAnnotation } from "./reporting.state";

/**
 * Creates a LangGraph subgraph for generating a final candidate report.
 *
 * This function implements a fan-out/fan-in pattern where three parallel nodes
 * generate different parts of the report's conclusion. A final builder node
 * then assembles these parts into a complete, structured report.
 *
 * @param llm - The ChatGoogleGenerativeAI model instance used by the generation nodes.
 * @returns A compiled LangGraph workflow ready for execution.
 */
export const createReportingSubgraph = (llm: ChatGoogleGenerativeAI) => {
    const summaryNode = createSummaryNode(llm);
    const recommendationsNode = createRecommendationsNode(llm);
    const interviewTopicsNode = createInterviewTopicsNode(llm);

    const workflow = new StateGraph(ReportingGraphStateAnnotation)
        .addNode('summaryNode', summaryNode)
        .addNode('recommendationsNode', recommendationsNode)
        .addNode('interviewTopicsNode', interviewTopicsNode)
        .addNode('reportBuilderNode', reportBuilderNode)
        .addEdge(START, 'summaryNode')
        .addEdge(START, 'recommendationsNode')
        .addEdge(START, 'interviewTopicsNode')
        .addEdge(
            ['summaryNode', 'recommendationsNode', 'interviewTopicsNode'],
            'reportBuilderNode'
        )
        .addEdge('reportBuilderNode', END);
    return workflow.compile();
};
