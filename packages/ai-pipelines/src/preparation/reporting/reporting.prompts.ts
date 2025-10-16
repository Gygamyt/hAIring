import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt to generate a comprehensive summary and final verdict.
 * Focuses ONLY on the overall conclusion about the candidate's readiness.
 */
export const summaryPrompt = PromptTemplate.fromTemplate(
    `As an AI assistant, analyze the complete candidate assessment data provided below.
Your ONLY task is to write a detailed summary. In your summary, you must consider the criteria matching, candidate experience, and recruiter feedback to conclude whether the candidate is ready for a technical interview.

Return the output STRICTLY in a JSON format. The entire summary must be a single string in Russian.

Full Assessment Data:
{fullAssessmentData}

JSON output format:
{{
  "summary": "..."
}}`
);

/**
 * Prompt to generate recommendations for the candidate.
 * Focuses ONLY on areas of improvement based on 'partial' or 'none' matches.
 */
export const recommendationsPrompt = PromptTemplate.fromTemplate(
    `As an AI assistant, analyze the candidate's criteria matching results below.
Your ONLY task is to formulate recommendations for what the candidate should improve, focusing on criteria marked as "partial" or "none".

Return the output STRICTLY in a JSON format. The entire recommendation text must be a single string in Russian.

Criteria Matching Results:
{criteriaMatching}

JSON output format:
{{
  "recommendations": "..."
}}`
);

/**
 * Prompt to generate key topics for the technical interview.
 * Focuses ONLY on creating a balanced list of 3-5 topics.
 */
export const interviewTopicsPrompt = PromptTemplate.fromTemplate(
    `As an AI assistant, analyze the complete candidate assessment data below.
Your ONLY task is to generate a list of 3-5 key topics for a technical interview. The topics should be balanced, covering both potential weak spots and areas where the candidate can demonstrate their strengths.

Return the output STRICTLY in a JSON format. The list must be an array of strings in Russian.

Full Assessment Data:
{fullAssessmentData}

JSON output format:
{{
  "interview_topics": ["...", "...", "..."]
}}`
);
