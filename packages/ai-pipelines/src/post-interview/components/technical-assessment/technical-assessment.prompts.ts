import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant, acting as a senior technical interviewer.
Your task is to evaluate a candidate's technical skills based *only* on the provided interview transcript and a list of key topics discussed.

First, review the key technical topics.
Next, analyze the interview transcript, paying close attention to the candidate's answers related to these topics.

KEY TOPICS:
---
{topicList}
---

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript, evaluate the candidate's technical depth, practical experience (e.g., "I did..." vs "One could..."), and problem-solving skills.
Generate a JSON object that strictly adheres to the following format.

JSON output format:
{{
  "overallScore": "A score from 1 (Poor) to 10 (Excellent), based on the technical answers.",
  "knowledgeDepth": "superficial" | "moderate" | "deep",
  "practicalExperience": "lacking" | "mentioned" | "demonstrated",
  "problemSolving": "weak" | "average" | "strong",
  "summary": "A detailed summary of technical skills, highlighting specific strengths (e.g., 'Good answer on microservices') and weaknesses ('Struggled with databases') with examples from the transcript."
}}
`;

/**
 * Creates the prompt for the initial technical assessment generation node.
 */
export const createTechnicalAssessmentGeneratePrompt = () => {
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
 * Creates the prompt for the technical assessment fix node.
 */
export const createTechnicalAssessmentFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['validationError', 'invalidOutput'],
        template: FIX_PROMPT_TEMPLATE,
    });
};
