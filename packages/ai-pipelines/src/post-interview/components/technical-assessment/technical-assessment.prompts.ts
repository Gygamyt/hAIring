import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert Senior Technical Interviewer.
Your task is to analyze an interview transcript against a list of key technical topics that were supposed to be discussed.

**LANGUAGE RULES (CRITICAL):**
1. The overall "summary" and each "summary" within the "topicAssessments" list MUST be written in RUSSIAN.
2. The fields "knowledgeDepth", "practicalExperience", "problemSolving", and "grade" MUST remain in English as per the specified enum values.
3. Keep the "topic" name exactly as it appears in the Key Topics list (usually English).
4. Use professional Russian technical terminology. Maintain English for specific technology names (e.g., "Docker", "Kubernetes", "JUnit").

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
3.  Assign a grade and a brief justification for the candidate's answer *for that specific topic* in RUSSIAN.
4.  Provide an *overall* assessment of the candidate's technical skills in RUSSIAN.

Generate a JSON object that strictly adheres to the following format.

JSON output format:
{{
  "knowledgeDepth": "very-deep" | "deep" | "moderate" | "superficial" | "none",
  "practicalExperience": "extensive" | "demonstrated" | "theoretical" | "none",
  "problemSolving": "excellent" | "good" | "average" | "weak" | "none",
  "summary": "Высокоуровневое резюме общей технической подготовки кандидата на РУССКОМ языке, синтезирующее все темы.",
  "topicAssessments": [
    {{
      "topic": "Название темы из входного списка (например, 'Test Automation')",
      "grade": "Excellent" | "Good" | "Moderate" | "Weak" | "Not Assessed",
      "summary": "Краткое обоснование оценки на РУССКОМ языке на основе ответа кандидата по этой конкретной теме. Если тема не обсуждалась, укажите 'Кандидату не задавали вопросы по этой теме.' и установите grade в 'Not Assessed'."
    }}
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
Your task is to correct the invalid JSON. 

**IMPORTANT**: Ensure all "summary" fields remain in RUSSIAN as originally intended.

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
