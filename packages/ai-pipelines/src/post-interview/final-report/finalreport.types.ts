import { z } from 'zod';

import { CandidateInfoSummaryOutputSchema } from '../components/candidate-info-summary';
import { CommunicationSkillsOutputSchema } from '../components/communication-skills';
import { ValuesFitOutputSchema } from '../components/values-fit';
import { TechnicalAssessmentOutputSchema } from '../components/technical-assessment';
import { LanguageAssessmentOutputSchema } from '../components/language-assessment';
import { AiSummaryOutputSchema } from '../components/ai-summary';
import { OverallConclusionOutputSchema } from '../components/overall-conclusion';
import { ExtractedTopicsSchema } from '../components/topic-extractor';

/**
 * Defines the final, composite DTO for the entire post-interview report.
 * This schema aggregates the outputs from all component subgraphs.
 */
export const FullReportDtoSchema = z.object({
    /**
     * Extracted list of topics discussed.
     */
    topics: ExtractedTopicsSchema.optional(),

    /**
     * Analysis of the candidate's CV.
     */
    cvSummary: CandidateInfoSummaryOutputSchema.optional(),

    /**
     * Assessment of the candidate's communication skills.
     */
    communicationSkills: CommunicationSkillsOutputSchema.optional(),

    /**
     * Assessment of the candidate's alignment with company values.
     */
    valuesFit: ValuesFitOutputSchema.optional(),

    /**
     * Assessment of the candidate's technical abilities.
     */
    technicalAssessment: TechnicalAssessmentOutputSchema.optional(),

    /**
     * Assessment of the candidate's language proficiency (if applicable).
     */
    languageAssessment: LanguageAssessmentOutputSchema.optional(),

    /**
     * A high-level AI-generated summary of the interview.
     */
    aiSummary: AiSummaryOutputSchema.optional(),

    /**
     * The final recommendation and synthesis of all analyses.
     */
    overallConclusion: OverallConclusionOutputSchema.optional(),
});

export type FullReportDto = z.infer<typeof FullReportDtoSchema>;
