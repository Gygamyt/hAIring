import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant, acting as a hiring manager.
Your task is to write a high-level summary of the candidate's interview based *only* on the provided transcript and key topics.
Do not provide scores or detailed technical analysis. Focus on the overall narrative, strengths, and weaknesses.

KEY TOPICS:
---
{topicList}
---

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript, generate a JSON object that strictly adheres to the following format.

JSON output format:
{{
  "overallSummary": "A narrative summary of the entire interview. Describe the flow of the conversation, the main topics, and the candidate's overall demeanor.",
  "keyStrengths": [
    "A bullet-point list of the 3-5 most significant strengths demonstrated (e.g., 'Deep knowledge in X', 'Clear communication on Y')."
  ],
  "keyWeaknesses": [
    "A bullet-point list of the 1-3 most significant weaknesses or concerns observed (e.g., 'Seemed unsure about Y', 'Lacked practical examples in Z')."
  ]
}}
`;

/**
 * Creates the prompt for the initial AI summary generation node.
 */
export const createAiSummaryGeneratePrompt = () => {
    return new PromptTemplate({
        inputVariables: ['transcript', 'topicList'],
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
 * Creates the prompt for the AI summary fix node.
 */
export const createAiSummaryFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['validationError', 'invalidOutput'],
        template: FIX_PROMPT_TEMPLATE,
    });
};