import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert Senior Technical Interviewer.
Your task is to analyze an interview transcript against a list of key technical topics that were supposed to be discussed.

**Input 1: Key Topics**
(This is the list of topics you must evaluate)
{topics}

**Input 2: Interview Transcript**
(This is the candidate's performance)
{transcript}

---
Based *only* on the inputs above, your tasks are:
1.  **Iterate** through *each* topic in the **Key Topics** list.
2.  Find where this topic was discussed in the **Interview Transcript**.
3.  Assign a grade and a brief justification for the candidate's answer *for that specific topic*.
4.  Provide an *overall* assessment of the candidate's technical skills.

Generate a JSON object that strictly adheres to the following format.

JSON output format:
{{
  "knowledgeDepth": "very-deep" | "deep" | "moderate" | "superficial" | "none",
  "practicalExperience": "extensive" | "demonstrated" | "theoretical" | "none",
  "problemSolving": "excellent" | "good" | "average" | "weak" | "none",
  "summary": "A high-level summary of the candidate's overall technical performance, synthesizing all topics.",
  "topicAssessments": [
    {{
      "topic": "Name of the topic from the input list (e.g., 'Test Automation')",
      "grade": "Excellent" | "Good" | "Moderate" | "Weak" | "Not Assessed",
      "summary": "Brief justification for the grade based on their answer for this specific topic. (e.g., 'Candidate provided a very strong, structured answer covering benefits and contexts like CI/CD.'). If not discussed, state 'Candidate was not asked about this topic.' and set grade to 'Not Assessed'."
    }},
    // ... (repeat for *every* topic in the Key Topics list)
  ]
}}
`;

/**
 * Creates the prompt for the initial technical assessment generation node.
 */
export const createTechnicalAssessmentGeneratePrompt = () => {
    return new PromptTemplate({
        inputVariables: ['transcript', 'topics'],
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
