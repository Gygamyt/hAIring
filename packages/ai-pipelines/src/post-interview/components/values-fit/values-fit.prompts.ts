import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant specializing in behavioral analysis and corporate values.
Your task is to evaluate a candidate's alignment with a set of company values, based *only* on the provided interview transcript.

First, carefully review the company values provided.
Next, analyze the entire interview transcript for statements, mindsets, or behavioral examples that align or misalign with those values.

**LANGUAGE RULES (CRITICAL):**
1. The "overallSummary" and each "evidence" field MUST be written in RUSSIAN.
2. The "match" field values MUST remain in English exactly as specified: "high", "medium", "low", or "not_discussed".
3. Maintain the "value" name as it appears in the company values list (keep original language).
4. Use professional Russian terminology for behavioral analysis.

COMPANY VALUES:
---
{companyValues}
---

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript and values, generate a JSON object that strictly adheres to the following format. 
Ensure all descriptive text is in RUSSIAN.

JSON output format:
{{
  "overallSummary": "Высокоуровневое резюме соответствия кандидата корпоративным ценностям на РУССКОМ языке.",
  "assessedValues": [
    {{
      "value": "Конкретная оцениваемая ценность (например, 'Ownership').",
      "match": "high" | "medium" | "low" | "not_discussed",
      "evidence": "Конкретные примеры, прямые цитаты или поведенческие доказательства из транскрипта на РУССКОМ языке для подтверждения оценки."
    }}
  ]
}}
`;

/**
 * Creates the prompt for the initial values fit generation node.
 */
export const createValuesFitGeneratePrompt = () => {
    return new PromptTemplate({
        inputVariables: ['transcript', 'companyValues'],
        template: GENERATE_PROMPT_TEMPLATE,
    });
};

// --- Fix Prompt ---

const FIX_PROMPT_TEMPLATE = `
You are a JSON correction agent. A previous step failed to produce valid JSON based on a schema.
Your task is to correct the invalid JSON. 

**IMPORTANT**: Ensure the "overallSummary" and "evidence" fields remain in RUSSIAN as originally intended.

**The Error:**
{validationError}

**The Invalid JSON you produced:**
{invalidOutput}

**Corrected JSON:**
`;

/**
 * Creates the prompt for the values fit fix node.
 */
export const createValuesFitFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['validationError', 'invalidOutput'],
        template: FIX_PROMPT_TEMPLATE,
    });
};
