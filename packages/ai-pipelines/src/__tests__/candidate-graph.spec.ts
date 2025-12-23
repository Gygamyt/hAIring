import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createCandidatePipeline } from "../preparation";


const mockCvData = { first_name: 'Иван', last_name: 'Иванов', skills: [], experience: '' };
const mockRequirementsData = { hard_skills_required: [], soft_skills_required: [] };
const mockFeedbackData = { comments: '' };

const mockGradeAndType = { grade: 'Middle', type: 'AQA' };
const mockCriteriaMatching = [{ criterion: 'Test', match: 'full', comment: 'OK' }];
const mockValuesAssessment = { values_assessment: 'OK' };

const mockSummary = { summary: 'OK' };
const mockRecommendations = { recommendations: 'OK' };
const mockInterviewTopics = { interview_topics: ['Test'] };


describe('Main Candidate Pipeline - End-to-End Test', () => {
    let llmInvokeSpy: jest.SpyInstance;

    beforeEach(() => {
        llmInvokeSpy = jest.spyOn(ChatGoogleGenerativeAI.prototype, 'invoke');
    });

    afterEach(() => {
        llmInvokeSpy.mockRestore();
    });

    it('should execute the full pipeline from raw text to final report', async () => {
        llmInvokeSpy
            .mockResolvedValueOnce(JSON.stringify(mockCvData))
            .mockResolvedValueOnce(JSON.stringify(mockRequirementsData))
            .mockResolvedValueOnce(JSON.stringify(mockFeedbackData))
            .mockResolvedValueOnce(JSON.stringify(mockGradeAndType))
            .mockResolvedValueOnce(JSON.stringify(mockCriteriaMatching))
            .mockResolvedValueOnce(JSON.stringify(mockValuesAssessment))
            .mockResolvedValueOnce(JSON.stringify(mockSummary))
            .mockResolvedValueOnce(JSON.stringify(mockRecommendations))
            .mockResolvedValueOnce(JSON.stringify(mockInterviewTopics));

        const llm = new ChatGoogleGenerativeAI({ model: 'gemini-pro', apiKey: 'testing' });

        const pipeline = createCandidatePipeline(llm);

        const initialInput = {
            cvText: 'cv',
            requirementsText: 'reqs',
            feedbackText: 'feedback',
        };

        const finalState = await pipeline.invoke(initialInput);
        expect(finalState.report).toBeDefined();
        expect(finalState.report!.first_name).toBe('Иван');
        expect(finalState.report!.candidate_profile).toBe('AQA, Middle');
        expect(finalState.report!.conclusion.summary).toBe('OK');
        expect(finalState.aggregatedResult).toBeDefined();
        expect(finalState.finalResult).toBeDefined();
        expect(llmInvokeSpy).toHaveBeenCalledTimes(9);
    });
});
