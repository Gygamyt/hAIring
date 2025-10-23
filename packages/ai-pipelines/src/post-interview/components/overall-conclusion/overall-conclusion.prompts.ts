import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are the final decision-maker, an expert Senior Hiring Manager.
Your task is to synthesize all the provided JSON analysis reports into a final, definitive hiring recommendation.
DO NOT analyze the raw transcript. Your decision must be based *only* on the structured JSON reports provided below.

**Key Task:** Compare the candidate's CV (Input 1) against their actual performance in the interview (Inputs 2-6) to identify matches or discrepancies.

**Input 1: CV Summary**
{parsedCv}

**Input 2: Technical Assessment**
{parsedTechnicalAssessment}

**Input 3: Communication Skills**
{parsedCommunicationSkills}

**Input 4: Values Fit**
{parsedValuesFit}

**Input 5: Language Assessment**
{parsedLanguageAssessment}

**Input 6: AI Summary**
{parsedAiSummary}

---
Based *only* on the JSON reports above, generate a final JSON object that strictly adheres to the following format.

JSON output format:
{{
  "recommendation": "Strong Hire" | "Hire" | "No Hire",
  "finalJustification": "A detailed, evidence-based justification for the recommendation. This summary MUST synthesize findings from all inputs. It should explicitly compare the CV (what was claimed) with the interview performance (what was demonstrated).",
  "keyPositives": [
    "A bullet-point list of the most significant positive factors driving this decision (e.g., 'Excellent problem-solving', 'Strong values fit')."
  ],
  "keyConcerns": [
    "A bullet-point list of the most significant red flags or concerns (e.g., 'CV experience seems inflated compared to technical answers', 'Poor communication')."
  ]
}}
`;

/**
 * Creates the prompt for the final overall conclusion generation node.
 */
export const createOverallConclusionGeneratePrompt = () => {
    return new PromptTemplate({
        inputVariables: [
            'parsedCv',
            'parsedTechnicalAssessment',
            'parsedCommunicationSkills',
            'parsedValuesFit',
            'parsedLanguageAssessment',
            'parsedAiSummary',
        ],
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
 * Creates the prompt for the overall conclusion fix node.
 */
export const createOverallConclusionFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['validationError', 'invalidOutput'],
        template: FIX_PROMPT_TEMPLATE,
    });
};
