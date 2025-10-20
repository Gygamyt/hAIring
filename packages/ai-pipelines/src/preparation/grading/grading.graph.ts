import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    createGradeAndTypeGenerateNode,
    validateGradeAndTypeNode,
    createFixGradeAndTypeNode,
    createCriteriaMatchingGenerateNode,
    validateCriteriaMatchingNode,
    createFixCriteriaMatchingNode,
    createValuesAssessmentGenerateNode,
    validateValuesAssessmentNode,
    createFixValuesAssessmentNode,
    assessmentAggregatorNode,
    handleFailureNode,
} from './grading.nodes';

import { GradingGraphStateAnnotation, GradingGraphState } from './grading.state';

const MAX_RETRIES = 1;

/**
 * Builds the full grading LangGraph workflow.
 *
 * This function creates a **fan-out/fan-in** architecture comprising three parallel evaluation tracks:
 * each performs content grading, validation, and optional correction.
 *
 * When any track exceeds the retry limit, the process immediately routes to an error handler node.
 * Otherwise, all successful branches converge at the aggregator node.
 *
 * **Graph Design Summary:**
 *
 * - Three parallel grading tracks:
 *   - Track 1: Grade & Type analysis
 *   - Track 2: Criteria Matching evaluation
 *   - Track 3: Values Assessment inspection
 * - Each track has a local retry loop through “fix” nodes
 * - `assessmentAggregatorNode` synchronizes results from all successful tracks
 * - `handleFailureNode` terminates early if any branch fails
 *
 * @param llm - A ChatGoogleGenerativeAI model instance used by all parsing and validation nodes
 * @returns A compiled StateGraph workflow ready to perform candidate grading
 *
 * @example
 * ```
 * const llm = new ChatGoogleGenerativeAI({ modelName: 'gemini-pro' });
 * const gradingGraph = createGradingSubgraph(llm);
 * const result = await gradingGraph.invoke({
 *   cv: {...},
 *   requirements: {...},
 *   feedback: {...}
 * });
 * ```
 *
 * @remarks
 * **ASCII Flow Diagram**
 *
 * ```
 *                               +------------------------+
 *                               |        START           |
 *                               +------------------------+
 *                                         |
 *       -------------------------------------------------------------------
 *       |                                 |                               |
 *  +------------------------------+  +-----------------------------+  +-----------------------------+
 *  | Track 1: Grade & Type        |  | Track 2: Criteria Matching  |  | Track 3: Values Assessment |
 *  +------------------------------+  +-----------------------------+  +-----------------------------+
 *  | generate -> validate -> fix ↺ |  | generate -> validate -> fix ↺ |  | generate -> validate -> fix ↺ |
 *       |                                 |                               |
 *       |-------------(success)-----------|-------------(success)----------|
 *                                         |
 *                                +-------------------+
 *                                |   AGGREGATOR      |
 *                                +-------------------+
 *                                         |
 *                                +-------------------+
 *                                |       END         |
 *                                +-------------------+
 *
 * Failure shortcut:
 * Any validation branch → handleFailureNode → END
 * ```
 */
export const createGradingSubgraph = (llm: ChatGoogleGenerativeAI) => {
    const routerGradeAndType = (state: GradingGraphState) => {
        const error = state.gradeAndTypeError as string | null;
        const retries = state.gradeAndTypeRetries as number | null;
        if (!error) return 'aggregator';
        if (retries !== null && retries >= MAX_RETRIES) return 'handleFailureNode';
        return 'fixGradeAndTypeNode';
    };

    const routerCriteriaMatching = (state: GradingGraphState) => {
        const error = state.criteriaMatchingError as string | null;
        const retries = state.criteriaMatchingRetries as number | null;
        if (!error) return 'aggregator';
        if (retries !== null && retries >= MAX_RETRIES) return 'handleFailureNode';
        return 'fixCriteriaMatchingNode';
    };

    const routerValuesAssessment = (state: GradingGraphState) => {
        const error = state.valuesAssessmentError as string | null;
        const retries = state.valuesAssessmentRetries as number | null;
        if (!error) return 'aggregator';
        if (retries !== null && retries >= MAX_RETRIES) return 'handleFailureNode';
        return 'fixValuesAssessmentNode';
    };

    const gradeAndTypeGenerateNode = createGradeAndTypeGenerateNode(llm);
    const fixGradeAndTypeNode = createFixGradeAndTypeNode(llm);

    const criteriaMatchingGenerateNode = createCriteriaMatchingGenerateNode(llm);
    const fixCriteriaMatchingNode = createFixCriteriaMatchingNode(llm);

    const valuesAssessmentGenerateNode = createValuesAssessmentGenerateNode(llm);
    const fixValuesAssessmentNode = createFixValuesAssessmentNode(llm);

    const workflow = new StateGraph(GradingGraphStateAnnotation)
        .addNode('gradeAndTypeGenerateNode', gradeAndTypeGenerateNode)
        .addNode('validateGradeAndTypeNode', validateGradeAndTypeNode)
        .addNode('fixGradeAndTypeNode', fixGradeAndTypeNode)
        .addNode('criteriaMatchingGenerateNode', criteriaMatchingGenerateNode)
        .addNode('validateCriteriaMatchingNode', validateCriteriaMatchingNode)
        .addNode('fixCriteriaMatchingNode', fixCriteriaMatchingNode)
        .addNode('valuesAssessmentGenerateNode', valuesAssessmentGenerateNode)
        .addNode('validateValuesAssessmentNode', validateValuesAssessmentNode)
        .addNode('fixValuesAssessmentNode', fixValuesAssessmentNode)
        .addNode('aggregator', assessmentAggregatorNode)
        .addNode('handleFailureNode', handleFailureNode)
        .addEdge(START, 'gradeAndTypeGenerateNode')
        .addEdge(START, 'criteriaMatchingGenerateNode')
        .addEdge(START, 'valuesAssessmentGenerateNode')
        // Track 1: Loop-enabled flow
        .addEdge('gradeAndTypeGenerateNode', 'validateGradeAndTypeNode')
        .addConditionalEdges('validateGradeAndTypeNode', routerGradeAndType)
        .addEdge('fixGradeAndTypeNode', 'validateGradeAndTypeNode')
        // Track 2: Loop-enabled flow
        .addEdge('criteriaMatchingGenerateNode', 'validateCriteriaMatchingNode')
        .addConditionalEdges('validateCriteriaMatchingNode', routerCriteriaMatching)
        .addEdge('fixCriteriaMatchingNode', 'validateCriteriaMatchingNode')
        // Track 3: Loop-enabled flow
        .addEdge('valuesAssessmentGenerateNode', 'validateValuesAssessmentNode')
        .addConditionalEdges('validateValuesAssessmentNode', routerValuesAssessment)
        .addEdge('fixValuesAssessmentNode', 'validateValuesAssessmentNode')
        // Common exits
        .addEdge('aggregator', END)
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
