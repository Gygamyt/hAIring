import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant specializing in parsing HR documents.
Your task is to extract structured information from the provided CV text.

Based *only* on the text below, generate a JSON object that strictly adheres to the following format.
Ensure all string values are in English.

CV TEXT:
---
{cvText}
---

JSON output format:
{{
  "fullName": "The full name of the candidate (e.g., 'John Doe').",
  "location": "The candidate's stated location (e.g., 'City, Country'). Omit if not found.",
  "summary": "A concise summary of the candidate (education, key experience) based on the CV.",
  "skills": ["A comprehensive list of all skills, technologies, or methodologies explicitly mentioned."],
  "yearsOfExperience": "The approximate total number of years of relevant professional experience. Omit if not found."
}}
`;

/**
 * Creates the prompt for the initial CV parsing generation node.
 */
export const createCandidateInfoSummaryGeneratePrompt = () => {
    return new PromptTemplate({
        inputVariables: ['cvText'],
        template: GENERATE_PROMPT_TEMPLATE,
    });
};

// --- Fix Prompt ---

const FIX_PROMPT_TEMPLATE = `
You are a JSON correction agent. A previous step failed to produce valid JSON based on a schema.
Your task is to correct the invalid JSON. Pay close attention to the error message.

**The Error:**
{validationError}

**The Invalid JSON you produced:**
{invalidOutput}

**Corrected JSON:**
`;

/**
 * Creates the prompt for the CV parsing fix node.
 */
export const createCandidateInfoSummaryFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['invalidOutput', 'validationError'],
        template: FIX_PROMPT_TEMPLATE,
    });
};
