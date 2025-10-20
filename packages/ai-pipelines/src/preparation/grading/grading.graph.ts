import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createGradeAndTypeNode,
    createCriteriaMatchingNode,
    createValuesAssessmentNode,
    assessmentAggregatorNode,
} from './grading.nodes';
import { GradingGraphStateAnnotation } from './grading.state';

/**
 * Creates a LangGraph subgraph for candidate grading based on parsed data.
 *
 * Implements a fan-out/fan-in pattern:
 * - Fan-out: START forks into three analysis nodes:
 *   - `gradeAndType` – determine candidate’s grade and type
 *   - `criteriaMatching` – match candidate against job criteria
 *   - `valuesAssessment` – assess candidate’s cultural fit and values
 * - Fan-in: results converge in `aggregator` node
 * - TERMINATE at END
 *
 * @param llm An instance of ChatGoogleGenerativeAI used by each analysis node.
 * @returns A compiled StateGraph workflow ready to execute the grading pipeline.
 *
 * @example
 * ```
 * const llm = new ChatGoogleGenerativeAI({ modelName: 'gemini-pro' });
 * const gradingGraph = createGradingSubgraph(llm);
 * const result = await gradingGraph.invoke({
 *   parsedCv: cvData,
 *   parsedRequirements: reqData,
 *   parsedFeedback: fbData,
 * });
 * ```
 *
 * @remarks
 * Graph structure (ASCII diagram):
 *```
 *        START
 *          |
 *        ╱ | ╲
 *      ╱   |   ╲
 * grade criteria values
 *   ╲      |      ╱
 *     ╲    |     ╱
 *      aggregator
 *          |
 *         END
 *```
 * The parallel execution occurs in a single "superstep" where all three parsers
 * run concurrently. The aggregator node is only invoked after all parser nodes
 * have completed their execution, ensuring all parsed data is available for aggregation.
 * @see {@link GradingGraphStateAnnotation} for state schema definition
 */
export const createGradingSubgraph = (llm: ChatGoogleGenerativeAI) => {
    const gradeAndTypeNode = createGradeAndTypeNode(llm);
    const criteriaMatchingNode = createCriteriaMatchingNode(llm);
    const valuesAssessmentNode = createValuesAssessmentNode(llm);

    const workflow = new StateGraph(GradingGraphStateAnnotation)
        .addNode('gradeAndTypeNode', gradeAndTypeNode)
        .addNode('criteriaMatchingNode', criteriaMatchingNode)
        .addNode('valuesAssessmentNode', valuesAssessmentNode)
        .addNode('aggregator', assessmentAggregatorNode).addEdge(START, 'gradeAndTypeNode')
        .addEdge(START, 'criteriaMatchingNode')
        .addEdge(START, 'valuesAssessmentNode')
        .addEdge(['gradeAndTypeNode', 'criteriaMatchingNode', 'valuesAssessmentNode'], 'aggregator')
        .addEdge('aggregator', END);

    return workflow.compile();
};
