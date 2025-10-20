import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt to determine the candidate's grade and type.
 * Focuses ONLY on classification based on experience and skills.
 */
export const gradeAndTypePrompt = PromptTemplate.fromTemplate(
    `As an experienced team lead, analyze the candidate's info and job requirements below.
Your ONLY task is to determine the candidate's most likely grade and type.
Base your analysis strictly on the provided data.

Return the output STRICTLY in a JSON format. The JSON values must be in Russian, **with one exception: the values for "grade" and "type" MUST be in English** from the allowed options.

Candidate Info:
{candidateInfo}

Job Requirements:
{jobRequirements}

JSON output format:
{{
  "grade": "Trainee" | "Junior" | "Middle" | "Senior",
  "type": "QA" | "AQA"
}}`
);

/**
 * Prompt to perform a detailed criteria matching analysis.
 * Focuses ONLY on comparing required hard skills against all available candidate data.
 */
export const criteriaMatchingPrompt = PromptTemplate.fromTemplate(
    `As an experienced team lead, analyze all available candidate data against each required hard skill.
For each criterion from 'hard_skills_required', determine the match level ("full", "partial", "none") by cross-referencing candidate skills, experience, and recruiter feedback.
Provide a brief, evidence-based comment for each criterion.

Return the output STRICTLY in a JSON array format.
All JSON values **must be in Russian**, WITH ONE EXCEPTION:
The "match" field MUST be one of these exact English values: "full", "partial", or "none".

Candidate Info:
{candidateInfo}

Job Requirements:
{jobRequirements}

Recruiter Feedback:
{recruiterFeedback}

JSON output format:
[
  {{
    "criterion": "...",
    "match": "full" | "partial" | "none",
    "comment": "..."
  }},
  {{
    "criterion": "...",
    "match": "full" | "partial" | "none",
    "comment": "..."
  }}
]`
);

/**
 * Prompt to assess the candidate's alignment with company values.
 * Focuses ONLY on soft skills and cultural fit based on feedback and requirements.
 */
export const valuesAssessmentPrompt = PromptTemplate.fromTemplate(
    `As an experienced team lead, assess the candidate's alignment with the values implied by the soft skill requirements and recruiter feedback.
Write a brief, concise conclusion. Your entire response should be a single string.

Return the output STRICTLY in a JSON format. The JSON values **must be in Russian**.

Job Requirements Soft Skills:
{softSkillsRequired}

Recruiter Feedback:
{recruiterFeedback}

JSON output format:
{{
  "values_assessment": "..."
}}`
);
