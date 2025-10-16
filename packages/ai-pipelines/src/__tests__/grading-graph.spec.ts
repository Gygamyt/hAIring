import { AggregatedData } from "../preparation/parsing/parsing.state";
import { assessmentAggregatorNode, createGradingSubgraph, CriteriaMatching, FinalResult, GradeAndType, GradingGraphState, ValuesAssessment } from "../preparation/grading";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const mockAggregatedResult: AggregatedData = {
    candidate_info: {
        first_name: 'Иван',
        last_name: 'Иванов',
        skills: ['Python', 'CI/CD', 'PostgreSQL'],
        experience: '3 года опыта в автоматизации...',
    },
    job_requirements: {
        hard_skills_required: ['Знание SQL', 'Опыт с CI/CD'],
        soft_skills_required: ['Коммуникабельность'],
    },
    recruiter_feedback: {
        comments: 'Кандидат неуверенно отвечал на вопросы про CI/CD.',
    },
};

const mockGradeAndType: GradeAndType = { grade: 'Middle', type: 'AQA' };

const mockCriteriaMatching: CriteriaMatching = [
    { criterion: 'Знание SQL', match: 'full', comment: 'Указан PostgreSQL.' },
    { criterion: 'Опыт с CI/CD', match: 'partial', comment: 'Упоминает в навыках, но фидбэк рекрутера говорит о неуверенности.' },
];

const mockValuesAssessment: ValuesAssessment = {
    values_assessment: 'Кандидат кажется достаточно коммуникабельным.',
};

describe('AI Grading Pipeline', () => {
    let llmInvokeSpy: jest.SpyInstance;

    beforeEach(() => {
        llmInvokeSpy = jest.spyOn(ChatGoogleGenerativeAI.prototype, 'invoke');
    });

    afterEach(() => {
        llmInvokeSpy.mockRestore();
    });

    describe('Node Unit Tests', () => {
        it('assessmentAggregatorNode should combine assessment data correctly', () => {
            const state: Partial<GradingGraphState> = {
                aggregatedResult: mockAggregatedResult,
                gradeAndType: mockGradeAndType,
                criteriaMatching: mockCriteriaMatching,
                valuesAssessment: mockValuesAssessment,
            };

            const result = assessmentAggregatorNode(state as GradingGraphState);
            const finalResult = result.finalResult as FinalResult;

            expect(finalResult.candidate_info).toEqual(mockAggregatedResult.candidate_info);
            expect(finalResult.assessment.grade).toBe('Middle');
            expect(finalResult.assessment.criteria_matching).toEqual(mockCriteriaMatching);
        });
    });

    describe('Graph Integration Test', () => {
        it('should execute the full grading flow and return the final combined result', async () => {
            llmInvokeSpy
                .mockResolvedValueOnce(JSON.stringify(mockGradeAndType))
                .mockResolvedValueOnce(JSON.stringify(mockCriteriaMatching))
                .mockResolvedValueOnce(JSON.stringify(mockValuesAssessment));

            const llm = new ChatGoogleGenerativeAI({ model: 'gemini-pro', apiKey: 'testing' });
            const gradingGraph = createGradingSubgraph(llm);

            const input: Partial<GradingGraphState> = {
                aggregatedResult: mockAggregatedResult,
            };

            const result = await gradingGraph.invoke(input as any);
            const finalResult = result.finalResult as FinalResult;

            expect(finalResult).toBeDefined();
            expect(finalResult.candidate_info.first_name).toBe('Иван');
            expect(finalResult.assessment).toBeDefined();
            expect(finalResult.assessment.grade).toBe('Middle');
            expect(finalResult.assessment.criteria_matching[1].match).toBe('partial');

            expect(llmInvokeSpy).toHaveBeenCalledTimes(3);
        });
    });
});
