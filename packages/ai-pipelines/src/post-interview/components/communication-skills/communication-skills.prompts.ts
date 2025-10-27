import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant specializing in analyzing human communication.
Your task is to evaluate the candidate's communication skills based *only* on the provided interview transcript.

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript, analyze the candidate's performance and generate a JSON object that strictly adheres to the following format.
Focus on clarity, structure (e.g., STAR method), and engagement.

JSON output format:
{{
  "overallScore": "A score from 1 (Poor) to 10 (Excellent).",
  "clarity": "poor" | "average" | "good" | "excellent",
  "structure": "unstructured" | "average" | "well-structured",
  "engagement": "low" | "medium" | "high",
  "summary": "A detailed summary of communication skills, highlighting specific strengths and weaknesses with examples from the transcript."
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
Your task is to correct the invalid JSON. Pay close attention to the error message.

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
