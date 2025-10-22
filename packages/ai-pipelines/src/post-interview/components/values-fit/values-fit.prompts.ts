import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant specializing in behavioral analysis and corporate values.
Your task is to evaluate a candidate's alignment with a set of company values, based *only* on the provided interview transcript.

First, carefully review the company values provided.
Next, analyze the entire interview transcript for statements, mindsets, or behavioral examples that align or misalign with those values.

COMPANY VALUES:
---
{companyValues}
---

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript and values, generate a JSON object that strictly adheres to the following format.
For each value, provide a "match" level and concrete "evidence" (like quotes) from the transcript.
If a value was not discussed or there is no evidence, mark it as "not_discussed".

JSON output format:
{{
  "overallSummary": "A high-level summary of the candidate's alignment with the provided company values.",
  "assessedValues": [
    {{
      "value": "The specific company value being assessed (e.g., 'Ownership').",
      "match": "high" | "medium" | "low" | "not_discussed",
      "evidence": "Specific examples, direct quotes, or behavioral evidence from the transcript to support the assessment."
    }},
    {{
      "value": "Another company value (e.g., 'Curiosity').",
      "match": "high" | "medium" | "low" | "not_discussed",
      "evidence": "Evidence for the second value."
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
Your task is to correct the invalid JSON. Pay close attention to the error message.

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
