import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant specializing in language proficiency assessment (CEFR).
Your task is to evaluate the candidate's English skills based *only* on the provided interview transcript.

**LANGUAGE RULES (CRITICAL):**
1. The "summary" and "reason" fields MUST be written in RUSSIAN.
2. All other fields ("overallLevel", "fluency", "vocabulary", "pronunciation") MUST remain in English as per the specified enum values.
3. Maintain professional Russian terminology for language assessment.

**IMPORTANT:**
1.  First, analyze the transcript to determine if a significant portion of the interview was conducted in English.
2.  If NO significant English was spoken, you MUST return the "SkippedAssessment" JSON object with the reason in RUSSIAN.
3.  If English WAS spoken, you MUST return the "AssessmentResult" JSON object with the summary in RUSSIAN.

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript, generate a JSON object that strictly adheres to ONE of the following formats.

**Format 1: If English was spoken (AssessmentResult):**
{{
  "assessmentSkipped": false,
  "overallLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native",
  "fluency": "choppy" | "moderate" | "fluent",
  "vocabulary": "basic" | "intermediate" | "advanced",
  "pronunciation": "heavy_accent" | "understandable" | "clear",
  "summary": "Резюме оценки языковых навыков на РУССКОМ языке, с указанием конкретных примеров сильных или слабых сторон."
}}

**Format 2: If NO English was spoken (SkippedAssessment):**
{{
  "assessmentSkipped": true,
  "reason": "Английский язык практически не использовался в ходе интервью."
}}
`;

/**
 * Creates the prompt for the initial language assessment generation node.
 */
export const createLanguageAssessmentGeneratePrompt = () => {
    return new PromptTemplate({
        inputVariables: ['transcript'],
        template: GENERATE_PROMPT_TEMPLATE,
    });
};

// --- Fix Prompt ---

const FIX_PROMPT_TEMPLATE = `
You are a JSON correction agent. A previous step failed to produce valid JSON based on a schema.
Your task is to correct the invalid JSON. 

**IMPORTANT**: Ensure the "summary" or "reason" fields remain in RUSSIAN as originally intended.

**The Error:**
{validationError}

**The Invalid JSON you produced:**
{invalidOutput}

**Corrected JSON:**
`;

/**
 * Creates the prompt for the language assessment fix node.
 */
export const createLanguageAssessmentFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['validationError', 'invalidOutput'],
        template: FIX_PROMPT_TEMPLATE,
    });
};
