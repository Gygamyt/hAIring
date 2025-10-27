import { FinalResult } from "../preparation/grading";
import { createReportingSubgraph, InterviewTopics, Recommendations, Report, reportBuilderNode, ReportingGraphState, Summary } from "../preparation/reporting";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const mockFinalResult: FinalResult = {
    candidate_info: {
        first_name: 'Иван',
        last_name: 'Иванов',
        skills: ['Python', 'CI/CD'],
        experience: '3 года опыта...',
    },
    job_requirements: {
        hard_skills_required: ['Опыт с CI/CD'],
        soft_skills_required: ['Коммуникабельность'],
    },
    recruiter_feedback: {
        comments: 'Кандидат показался мотивированным.',
    },
    assessment: {
        grade: 'Middle',
        type: 'AQA',
        criteria_matching: [
            { criterion: 'Опыт с CI/CD', match: 'partial', comment: 'Упоминает в навыках, но фидбэк подтверждает неуверенные ответы.' },
        ],
        values_assessment: 'Судя по фидбэку, кандидат проактивен.',
    },
};

const mockSummary: Summary = {
    summary: 'Кандидат в целом подходит для технического этапа, но стоит обратить внимание на CI/CD.',
};

const mockRecommendations: Recommendations = {
    recommendations: 'Рекомендуется углубить знания в работе с CI/CD системами.',
};

const mockInterviewTopics: InterviewTopics = {
    interview_topics: [
        'Обсудить опыт проектирования тестовых фреймворков',
        'Глубина понимания принципов CI/CD',
    ],
};

describe('AI Reporting Pipeline', () => {
    let llmInvokeSpy: jest.SpyInstance;

    beforeEach(() => {
        llmInvokeSpy = jest.spyOn(ChatGoogleGenerativeAI.prototype, 'invoke');
    });

    afterEach(() => {
        llmInvokeSpy.mockRestore();
    });

    describe('Node Unit Tests', () => {
        it('reportBuilderNode should correctly assemble the final report', () => {
            const state: Partial<ReportingGraphState> = {
                finalResult: mockFinalResult,
                summary: mockSummary,
                recommendations: mockRecommendations,
                interviewTopics: mockInterviewTopics,
            };

            const result = reportBuilderNode(state as ReportingGraphState);
            const report = result.report as Report;

            expect(report.first_name).toBe('Иван');
            expect(report.candidate_profile).toBe('AQA, Middle');
            expect(report.conclusion.summary).toBe(mockSummary.summary);
            expect(report.conclusion.interview_topics.length).toBe(2);
        });
    });

    describe('Graph Integration Test', () => {
        it('should execute the full reporting flow and return the final report', async () => {
            llmInvokeSpy
                .mockResolvedValueOnce(JSON.stringify(mockSummary))
                .mockResolvedValueOnce(JSON.stringify(mockRecommendations))
                .mockResolvedValueOnce(JSON.stringify(mockInterviewTopics));

            const llm = new ChatGoogleGenerativeAI({ model: 'gemini-pro', apiKey: 'testing' });
            const reportingGraph = createReportingSubgraph(llm);

            const input: Partial<ReportingGraphState> = {
                finalResult: mockFinalResult,
            };

            const result = await reportingGraph.invoke(input as any);
            const report = result.report as Report;

            expect(report).toBeDefined();
            expect(report.first_name).toBe('Иван');
            expect(report.candidate_profile).toBe('AQA, Middle');
            expect(report.conclusion.recommendations).toBe(mockRecommendations.recommendations);
            expect(report.matching_table[0].match).toBe('partial');
            expect(llmInvokeSpy).toHaveBeenCalledTimes(3);
        });
    });
});
