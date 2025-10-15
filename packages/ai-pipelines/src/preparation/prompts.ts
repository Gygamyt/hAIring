import { PromptTemplate } from '@langchain/core/prompts';

export const dataParserPrompt = PromptTemplate.fromTemplate(
    `Your task is to analyze the following CV, job requirements, and recruiter feedback.
Extract the required information and return it STRICTLY in a JSON format.
The JSON values **must be in Russian**.

CV:
{cvText}

Job Requirements:
{requirementsText}

Recruiter Feedback:
{feedbackText}

JSON output format:
{{
    "firstName": "Candidate's first name in Russian",
    "lastName": "Candidate's last name in Russian",
    "keySkills": ["Key skill 1 in Russian", "Key skill 2 in Russian"],
    "profileSummary": "A brief 2-3 sentence summary of the candidate's profile in Russian."
}}
`
);
