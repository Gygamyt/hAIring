import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
    // --- Track 1 ---
    createCvGenerateNode,
    validateCvNode,
    createFixCvNode,
    // --- Track 2 ---
    createRequirementsGenerateNode,
    validateRequirementsNode,
    createFixRequirementsNode,
    // --- Track 3 ---
    createFeedbackGenerateNode,
    validateFeedbackNode,
    createFixFeedbackNode,
    // --- Join/End ---
    aggregatorNode,
    handleFailureNode,
} from "./parsing.nodes";
import { PreparationGraphStateAnnotation, PreparationGraphState } from "./parsing.state";

/**
 * Максимальное количество попыток исправления (1 генерация + 2 исправления).
 */
const MAX_RETRIES = 2;

// --------------------------------------------------------------------------------
// --- УСЛОВНЫЕ РОУТЕРЫ ------------------------------------------------------------
// --------------------------------------------------------------------------------

const routerCv = (state: PreparationGraphState) => {
    const error = (state as any).cvError;
    const retries = (state as any).cvRetries;
    if (!error) return 'aggregator';
    if (retries >= MAX_RETRIES) return 'handleFailureNode';
    return 'fixCvNode';
};

const routerRequirements = (state: PreparationGraphState) => {
    const error = (state as any).requirementsError;
    const retries = (state as any).requirementsRetries;
    if (!error) return 'aggregator';
    if (retries >= MAX_RETRIES) return 'handleFailureNode';
    return 'fixRequirementsNode';
};

const routerFeedback = (state: PreparationGraphState) => {
    const error = (state as any).feedbackError;
    const retries = (state as any).feedbackRetries;
    if (!error) return 'aggregator';
    if (retries >= MAX_RETRIES) return 'handleFailureNode';
    return 'fixFeedbackNode';
};

// --------------------------------------------------------------------------------
// --- ГРАФ -----------------------------------------------------------------------
// --------------------------------------------------------------------------------

/**
 * Creates a robust LangGraph subgraph for parallel parsing. (ОБНОВЛЕНО)
 *
 * @param llm - Google Generative AI chat model instance.
 * @returns A compiled LangGraph workflow.
 */
export const createParsingSubgraph = (llm: ChatGoogleGenerativeAI) => {
    // --- Инициализация узлов ---
    const cvGenerateNode = createCvGenerateNode(llm);
    const fixCvNode = createFixCvNode(llm);
    const requirementsGenerateNode = createRequirementsGenerateNode(llm);
    const fixRequirementsNode = createFixRequirementsNode(llm);
    const feedbackGenerateNode = createFeedbackGenerateNode(llm);
    const fixFeedbackNode = createFixFeedbackNode(llm);

    const workflow = new StateGraph(PreparationGraphStateAnnotation)
        // --- Добавляем все 11 узлов ---
        .addNode('cvGenerateNode', cvGenerateNode)
        .addNode('validateCvNode', validateCvNode)
        .addNode('fixCvNode', fixCvNode)

        .addNode('requirementsGenerateNode', requirementsGenerateNode)
        .addNode('validateRequirementsNode', validateRequirementsNode)
        .addNode('fixRequirementsNode', fixRequirementsNode)

        .addNode('feedbackGenerateNode', feedbackGenerateNode)
        .addNode('validateFeedbackNode', validateFeedbackNode)
        .addNode('fixFeedbackNode', fixFeedbackNode)

        .addNode('aggregator', aggregatorNode)
        .addNode('handleFailureNode', handleFailureNode)

        // --- Вход (Fan-Out) ---
        .addEdge(START, 'cvGenerateNode')
        .addEdge(START, 'requirementsGenerateNode')
        .addEdge(START, 'feedbackGenerateNode')

        // --- Логика Track 1 (CV) ---
        .addEdge('cvGenerateNode', 'validateCvNode')
        .addConditionalEdges('validateCvNode', routerCv)
        .addEdge('fixCvNode', 'validateCvNode') // Loop

        // --- Логика Track 2 (Requirements) ---
        .addEdge('requirementsGenerateNode', 'validateRequirementsNode')
        .addConditionalEdges('validateRequirementsNode', routerRequirements)
        .addEdge('fixRequirementsNode', 'validateRequirementsNode') // Loop

        // --- Логика Track 3 (Feedback) ---
        .addEdge('feedbackGenerateNode', 'validateFeedbackNode')
        .addConditionalEdges('validateFeedbackNode', routerFeedback)
        .addEdge('fixFeedbackNode', 'validateFeedbackNode') // Loop

        // --- Выход (Fan-In) ---
        .addEdge('aggregator', END)
        .addEdge('handleFailureNode', END);

    return workflow.compile();
};
