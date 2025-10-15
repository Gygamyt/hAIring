import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { cvParserPrompt, requirementsParserPrompt, feedbackParserPrompt } from './parsing.prompts';
import { PreparationGraphState } from "../state";


export const createCvParserNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        console.log("--- 🚀 Executing Node: CV Parser ---");
        const chain = cvParserPrompt.pipe(llm).pipe(new JsonOutputParser());
        const cvData = await chain.invoke({ cvText: state.cvText });
        return { cvData };
    };

export const createRequirementsParserNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        console.log("--- 🚀 Executing Node: Requirements Parser ---");
        const chain = requirementsParserPrompt.pipe(llm).pipe(new JsonOutputParser());
        const requirementsData = await chain.invoke({ requirementsText: state.requirementsText });
        return { requirementsData };
    };

export const createFeedbackParserNode = (llm: ChatGoogleGenerativeAI) =>
    async (state: PreparationGraphState): Promise<Partial<PreparationGraphState>> => {
        console.log("--- 🚀 Executing Node: Feedback Parser ---");
        const chain = feedbackParserPrompt.pipe(llm).pipe(new JsonOutputParser());
        const feedbackData = await chain.invoke({ feedbackText: state.feedbackText });
        return { feedbackData };
    };

export const aggregatorNode = (state: PreparationGraphState): Partial<PreparationGraphState> => {
    console.log("--- 🖇️ Executing Node: Aggregator ---");
    const parsedData = {
        candidate_info: state.cvData,
        job_requirements: state.requirementsData,
        recruiter_feedback: state.feedbackData,
    };
    return { parsedData };
};
