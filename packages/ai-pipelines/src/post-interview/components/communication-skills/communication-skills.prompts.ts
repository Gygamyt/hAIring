import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant specializing in analyzing human communication.
Your task is to evaluate the candidate's communication skills based *only* on the provided interview transcript.

**LANGUAGE RULES (CRITICAL):**
1. The "summary" field MUST be written in RUSSIAN.
2. All other fields ("clarity", "structure", "engagement") MUST remain in English as per the specified enum values.
3. Use professional Russian terminology related to communication (e.g., "логика изложения", "активное слушание", "структура ответа").

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript, analyze the candidate's performance and generate a JSON object. Ensure the summary is in RUSSIAN.

JSON output format:
{{
  "overallScore": "Балл от 1 (Poor) до 10 (Excellent).",
  "clarity": "poor" | "average" | "good" | "excellent",
  "structure": "unstructured" | "average" | "well-structured",
  "engagement": "low" | "medium" | "high",
  "summary": "Детальный отчет о навыках коммуникации на РУССКОМ языке, подчеркивающий сильные стороны и области для улучшения с примерами из транскрипта."
}}
`;

/**
 * Creates the prompt for the initial communication skills generation node.
 */
export const createCommunicationSkillsGeneratePrompt = () => {
    return new PromptTemplate({
        inputVariables: ['transcript'],
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
 * Creates the prompt for the communication skills fix node.
 */
export const createCommunicationSkillsFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['validationError', 'invalidOutput'],
        template: FIX_PROMPT_TEMPLATE,
    });
};
