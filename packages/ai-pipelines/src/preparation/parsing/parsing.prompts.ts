import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt to extract structured data ONLY from a CV.
 */
export const cvParserPrompt = PromptTemplate.fromTemplate(
    `Your task is to analyze ONLY the CV text provided below.
Extract the candidate's first name, last name, all technical skills, and a summary of their experience.
Return the output STRICTLY in a JSON format. The JSON values **must be in Russian**.

CV Text:
{cvText}

JSON output format:
{{
  "first_name": "...",
  "last_name": "...",
  "skills": ["...", "..."],
  "experience": "..."
}}`
);

/**
 * Prompt to extract structured data ONLY from job requirements.
 */
export const requirementsParserPrompt = PromptTemplate.fromTemplate(
    `Your task is to analyze ONLY the job requirements text provided below.
Extract the key hard and soft skills required for the position.
Return the output STRICTLY in a JSON format. The JSON values **must be in Russian**.

Job Requirements Text:
{requirementsText}

JSON output format:
{{
  "hard_skills_required": ["...", "..."],
  "soft_skills_required": ["...", "..."]
}}`
);

/**
 * Prompt to extract structured data ONLY from recruiter feedback.
 */
export const feedbackParserPrompt = PromptTemplate.fromTemplate(
    `Your task is to analyze ONLY the recruiter's feedback text provided below.
Extract any comments, observations, and the overall assessment from the text.
Return the output STRICTLY in a JSON format. The JSON values **must be in Russian**.

Recruiter Feedback Text:
{feedbackText}

JSON output format:
{{
  "comments": "..."
}}`
);
