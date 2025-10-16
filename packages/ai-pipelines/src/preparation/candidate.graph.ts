import { StateGraph, START, END } from '@langchain/langgraph';
import { CandidatePipelineSchema } from './candidate.state';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createParsingSubgraph } from "./parsing";
import { createGradingSubgraph } from "./grading";
import { createReportingSubgraph } from "./reporting";

/**
 * Creates the main candidate processing pipeline by composing subgraphs.
 * This master graph orchestrates the flow from raw text inputs to a final structured report.
 *
 * @param llm - The ChatGoogleGenerativeAI model instance shared across all subgraphs.
 * @returns A compiled, runnable LangGraph workflow for the entire process.
 *
 * @remarks
 * The pipeline follows a clear, linear sequence of transformations:
 * 1. **Parsing**: Extracts and structures information from raw texts.
 * 2. **Grading**: Analyzes the structured data to produce an expert assessment.
 * 3. **Reporting**: Generates a final, human-readable report from the assessment.
 */
export const createCandidatePipeline = (llm: ChatGoogleGenerativeAI) => {
    const parsingSubgraph = createParsingSubgraph(llm);
    const gradingSubgraph = createGradingSubgraph(llm);
    const reportingSubgraph = createReportingSubgraph(llm);

    const workflow = new StateGraph(CandidatePipelineSchema)
        .addNode('parsing', parsingSubgraph)
        .addNode('grading', gradingSubgraph)
        .addNode('reporting', reportingSubgraph)
        .addEdge(START, 'parsing')
        .addEdge('parsing', 'grading')
        .addEdge('grading', 'reporting')
        .addEdge('reporting', END);

    return workflow.compile();
};
