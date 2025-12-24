import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt to extract topics from interview transcription.
 * Updated to ensure output is in Russian.
 */
export const topicExtractorPrompt = PromptTemplate.fromTemplate(
    `Your task is to analyze the technical interview transcript below and create a detailed list of key questions or topics discussed.

**LANGUAGE RULES (CRITICAL):**
1. All extracted topics MUST be written in RUSSIAN.
2. Maintain technical terms (e.g., "REST API", "Postman", "CI/CD") in English where they are part of the professional nomenclature, but the surrounding descriptive text must be in Russian.

Input:
- Full transcription text.

Actions:
1. Carefully read the entire text.
2. For each logical block of conversation, formulate the main question or technical topic the candidate was trying to answer in RUSSIAN.
3. Omit common phrases, comments, and small talk. Focus on specific technical and behavioral questions.
4. The result must be a list of specific, discussed topics.

Output Format:
- Return the result strictly as a SINGLE valid JSON object.
- The JSON must contain a single key "topics", whose value is an array of strings (topic names).
- Do not add any explanations, headers, or Markdown formatting.

Example Output:
\`\`\`json
{{
  "topics": [
    "Разница между методами Put и Patch в REST API",
    "Назначение и типы переменных в Postman",
    "Объяснение нормализации и денормализации баз данных",
    "Ключевые отличия между Scrum и Kanban",
    "Особенности тестирования в блокчейн-проектах"
  ]
}}
\`\`\`

Transcription Text:
{transcript}`,
);

/**
 * Prompt to fix invalid JSON output from topicExtractorPrompt.
 * Updated to enforce Russian language preservation.
 */
export const fixTopicExtractorJsonPrompt = PromptTemplate.fromTemplate(
    `You are a JSON correction agent. A previous step failed to produce valid JSON.
Your task is to correct the invalid JSON based on the provided error.

**IMPORTANT**: Ensure all topics remain in RUSSIAN as originally intended.

Ensure the output STRICTLY follows this format:
{{
  "topics": ["...", "...", "..."]
}}
- The value for "topics" MUST be an array of strings.
- Return ONLY the corrected, valid JSON object.

The Error:
{error}

The Invalid JSON you produced:
{rawOutput}

Corrected JSON:`,
);
