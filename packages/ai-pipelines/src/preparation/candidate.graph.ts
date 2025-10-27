import { StateGraph, START, END } from '@langchain/langgraph';
import { CandidatePipelineSchema } from './candidate.state';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createParsingSubgraph } from "./parsing";
import { createGradingSubgraph } from "./grading";
import { createReportingSubgraph } from "./reporting";
import { checkFailure, failureNode } from "./candidate.nodes";

/**
 * Creates the main candidate processing pipeline by composing subgraphs.
 * This master graph orchestrates the flow from raw text inputs to a final structured report.
 *
 * @param llm - The ChatGoogleGenerativeAI model instance shared across all subgraphs.
 * @returns A compiled, runnable LangGraph workflow for the entire process.
 *
 * @remarks
 * The pipeline is conditional:
 * 1. `START -> parsing`
 * 2. `parsing -> checkFailure`
 * - (OK) -> `grading`
 * - (FAIL) -> `failure`
 * 3. `grading -> checkFailure`
 * - (OK) -> `reporting`
 * - (FAIL) -> `failure`
 * 4. `reporting -> checkFailure`
 * - (OK) -> `END`
 * - (FAIL) -> `failure`
 * 5. `failure -> END`
 */
export const createCandidatePipeline = (llm: ChatGoogleGenerativeAI) => {
    const parsingSubgraph = createParsingSubgraph(llm);
    const gradingSubgraph = createGradingSubgraph(llm);
    const reportingSubgraph = createReportingSubgraph(llm);

    const workflow = new StateGraph(CandidatePipelineSchema)
        .addNode('parsing', parsingSubgraph)
        .addNode('grading', gradingSubgraph)
        .addNode('reporting', reportingSubgraph)
        .addNode('failure', failureNode)
        .addEdge(START, 'parsing')
        .addConditionalEdges('parsing', checkFailure, {
            '__CONTINUE__': 'grading',
            'failure': 'failure',
        })
        .addConditionalEdges('grading', checkFailure, {
            '__CONTINUE__': 'reporting',
            'failure': 'failure',
        })
        .addConditionalEdges('reporting', checkFailure, {
            '__CONTINUE__': END,
            'failure': 'failure',
        })
        .addEdge('failure', END);

    return workflow.compile();
};
