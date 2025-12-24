import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant specializing in parsing HR documents.
Your task is to extract structured information from the provided CV text.

**LANGUAGE RULES (CRITICAL):**
1. The "summary" field MUST be written in RUSSIAN.
2. The "fullName" and "location" should be extracted as they appear in the text (keep original language).
3. The "skills" list should contain technical terms in their original form (usually English, e.g., "React", "Python").
4. Maintain a professional tone in the Russian summary.

Based *only* on the text below, generate a JSON object that strictly adheres to the following format.

CV TEXT:
---
{cvText}
---

JSON output format:
{{
  "fullName": "Полное имя кандидата (например, 'Иван Иванов' или 'John Doe').",
  "location": "Местоположение кандидата (например, 'Москва, Россия' или 'London, UK'). Пропустите, если не найдено.",
  "summary": "Краткое резюме кандидата на РУССКОМ языке (образование, ключевой опыт), основанное на CV.",
  "skills": ["Полный список всех навыков, технологий или методологий, явно упомянутых в тексте."],
  "yearsOfExperience": 5
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
Your task is to correct the invalid JSON. 

**IMPORTANT**: Ensure the "summary" field remains in RUSSIAN as originally intended.

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
