import { Annotation } from '@langchain/langgraph';
import { InferGraphState } from '../../utils';

import { CandidateInfoSummaryOutput } from '../components/candidate-info-summary';
import { CommunicationSkillsOutput } from '../components/communication-skills';
import { ValuesFitOutput } from '../components/values-fit';
import { TechnicalAssessmentOutput } from '../components/technical-assessment';
import { LanguageAssessmentOutput } from '../components/language-assessment';
import { AiSummaryOutput } from '../components/ai-summary';
import { OverallConclusionOutput } from '../components/overall-conclusion';
import { FullReportDto } from './finalreport.types';

/**
 * The RAW SCHEMA OBJECT for the FinalReport (Orchestrator) subgraph.
 * We export this so we can extend it in the graph file.
 */
export const FinalReportStateSchema = {
    // --- RAW INPUTS (From Worker) ---
    cvText: Annotation<string>(),
    transcript: Annotation<string>(),
    companyValues: Annotation<string>(),

    // --- FINAL OUTPUT ---
    finalReport: Annotation<FullReportDto | null>(),
    graphError: Annotation<string | null>(),

    // --- Fields for TopicExtractor ---
    // (Предполагаем, что TopicExtractorState имеет `topics: string[] | null`)
    topics: Annotation<string[] | null>(),
    rawTopics: Annotation<string | null>(),
    topicsError: Annotation<string | null>(),
    topicsRetries: Annotation<number>(),

    // --- Fields for CandidateInfoSummary ---
    parsedCv: Annotation<CandidateInfoSummaryOutput | null>(),
    rawCvSummary: Annotation<string | null>(),
    cvTraceId: Annotation<string | null>(),
    cvValidationError: Annotation<string | null>(),
    cvRetries: Annotation<number>(),

    // --- Fields for TechnicalAssessment ---
    parsedTechnicalAssessment: Annotation<TechnicalAssessmentOutput | null>(),
    rawTechnicalAssessment: Annotation<string | null>(),
    techTraceId: Annotation<string | null>(),
    techValidationError: Annotation<string | null>(),
    techRetries: Annotation<number>(),

    // --- Fields for CommunicationSkills ---
    parsedCommunicationSkills: Annotation<CommunicationSkillsOutput | null>(),
    rawCommunicationSkills: Annotation<string | null>(),
    commTraceId: Annotation<string | null>(),
    commValidationError: Annotation<string | null>(),
    commRetries: Annotation<number>(),

    // --- Fields for ValuesFit ---
    parsedValuesFit: Annotation<ValuesFitOutput | null>(),
    rawValuesFit: Annotation<string | null>(),
    valuesTraceId: Annotation<string | null>(),
    valuesValidationError: Annotation<string | null>(),
    valuesRetries: Annotation<number>(),

    // --- Fields for LanguageAssessment ---
    parsedLanguageAssessment: Annotation<LanguageAssessmentOutput | null>(),
    rawLanguageAssessment: Annotation<string | null>(),
    langTraceId: Annotation<string | null>(),
    langValidationError: Annotation<string | null>(),
    langRetries: Annotation<number>(),

    // --- Fields for AiSummary ---
    parsedAiSummary: Annotation<AiSummaryOutput | null>(),
    rawAiSummary: Annotation<string | null>(),
    summaryTraceId: Annotation<string | null>(),
    summaryValidationError: Annotation<string | null>(),
    summaryRetries: Annotation<number>(),

    // --- Fields for OverallConclusion ---
    parsedOverallConclusion: Annotation<OverallConclusionOutput | null>(),
    rawOverallConclusion: Annotation<string | null>(),
    conclusionTraceId: Annotation<string | null>(),
    conclusionValidationError: Annotation<string | null>(),
    conclusionRetries: Annotation<number>(),
};

/**
 * The LangGraph SCHEMA DEFINITION for the FinalReport (Orchestrator) subgraph.
 */
export const FinalReportStateAnnotation = Annotation.Root(FinalReportStateSchema);

/**
 * The TypeScript data type for the FinalReport (Orchestrator) subgraph's state.
 */
export type IFinalReportState = InferGraphState<typeof FinalReportStateAnnotation>;
