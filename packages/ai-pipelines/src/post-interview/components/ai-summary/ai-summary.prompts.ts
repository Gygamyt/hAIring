import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are an expert AI assistant, acting as a hiring manager.
Your task is to write a high-level summary of the candidate's interview based *only* on the provided transcript and key topics.
Do not provide scores or detailed technical analysis. Focus on the overall narrative, strengths, and weaknesses.

**LANGUAGE RULES (CRITICAL):**
1. All descriptive text fields ("overallSummary", "keyStrengths", "keyWeaknesses") MUST be written in RUSSIAN.
2. Use professional Russian recruitment terminology. Use "Сильные стороны" for strengths and "Зоны роста" or "Замечания" for weaknesses.
3. Keep technical terms in English where appropriate, but the surrounding context must be in Russian.

KEY TOPICS:
---
{topicList}
---

INTERVIEW TRANSCRIPT:
---
{transcript}
---

Based *only* on the transcript, generate a JSON object that strictly adheres to the following format. Ensure all text is in RUSSIAN.

JSON output format:
{{
  "overallSummary": "Краткое повествовательное резюме всего интервью на РУССКОМ языке. Опишите ход беседы, основные затронутые темы и общее впечатление от поведения кандидата.",
  "keyStrengths": [
    "Список из 3-5 наиболее значимых сильных сторон на РУССКОМ языке (например, 'Глубокие знания в X', 'Четкая аргументация по Y')."
  ],
  "keyWeaknesses": [
    "Список из 1-3 наиболее значимых слабых мест или зон роста на РУССКОМ языке (например, 'Неуверенность в вопросах Y', 'Нехватка практических примеров в Z')."
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
Your task is to correct the invalid JSON. 

**IMPORTANT**: Ensure all descriptive text remains in RUSSIAN as originally intended.

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
