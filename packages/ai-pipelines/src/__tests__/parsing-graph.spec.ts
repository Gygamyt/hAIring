import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { CvData, FeedbackData, PreparationGraphState, RequirementsData } from "../preparation/parsing/parsing.state";
import { aggregatorNode } from "../preparation/parsing/parsing.nodes";
import { createParsingSubgraph } from "../preparation/parsing";

const mockCvData: CvData = {
    first_name: 'Иван',
    last_name: 'Иванов',
    skills: ['TypeScript', 'React', 'NestJS'],
    experience: 'Работал 5 лет в компании X.',
};

const mockRequirementsData: RequirementsData = {
    hard_skills_required: ['TypeScript', 'Docker'],
    soft_skills_required: ['Коммуникабельность'],
};

const mockFeedbackData: FeedbackData = {
    comments: 'Отличный кандидат, хорошо разбирается в теме.',
};

describe('AI Parsing Pipeline', () => {
    let llmInvokeSpy: jest.SpyInstance;
    beforeEach(() => {
        llmInvokeSpy = jest
            .spyOn(ChatGoogleGenerativeAI.prototype, 'invoke')
            // @ts-ignore
            .mockImplementation(async () => {
                return {};
            });
    });

    afterEach(() => {
        llmInvokeSpy.mockRestore();
    });

    describe('Node Unit Tests', () => {
        it('aggregatorNode should correctly combine data from the state', () => {
            const state: Partial<PreparationGraphState> = {
                parsedCv: mockCvData,
                parsedRequirements: mockRequirementsData,
                parsedFeedback: mockFeedbackData,
            };
            const result = aggregatorNode(state as PreparationGraphState);
            expect(result.aggregatedResult.candidate_info).toBe(mockCvData);
        });

        it('aggregatorNode should throw an error if data is missing', () => {
            const incompleteState: Partial<PreparationGraphState> = { parsedCv: mockCvData };
            expect(() => aggregatorNode(incompleteState as PreparationGraphState))
                .toThrow('Aggregator received incomplete data.');
        });
    });

    describe('Graph Integration Test', () => {
        it('should execute the full parsing flow and return aggregated data', async () => {
            const llm = new ChatGoogleGenerativeAI({ model: 'gemini-pro', apiKey: 'testing' });
            const parsingGraph = createParsingSubgraph(llm);

            llmInvokeSpy
                .mockResolvedValueOnce(JSON.stringify(mockCvData))
                .mockResolvedValueOnce(JSON.stringify(mockRequirementsData))
                .mockResolvedValueOnce(JSON.stringify(mockFeedbackData));

            const input = {
                cvText: 'cv text here',
                requirementsText: 'requirements text here',
                feedbackText: 'feedback text here',
            };

            const result = await parsingGraph.invoke(input);

            expect(result.aggregatedResult).toBeDefined();
            expect(result.aggregatedResult.candidate_info).toEqual(mockCvData);
            expect(result.aggregatedResult.job_requirements).toEqual(mockRequirementsData);
            expect(result.aggregatedResult.recruiter_feedback).toEqual(mockFeedbackData);

            expect(llmInvokeSpy).toHaveBeenCalledTimes(3);
        });
    });
});
