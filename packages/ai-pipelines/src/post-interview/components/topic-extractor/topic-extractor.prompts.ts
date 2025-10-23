import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt to extract topics from interview transcription.
 */
export const topicExtractorPrompt = PromptTemplate.fromTemplate(
    `Your task is to analyze the technical interview transcript below and create a detailed list of key questions or topics discussed.

Input:
- Full transcription text.

Actions:
1. Carefully read the entire text.
2. For each logical block of conversation, formulate the main question the candidate was trying to answer.
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
    "Difference between Put and Patch in REST API",
    "Purpose and types of variables in Postman",
    "Explanation of database normalization and denormalization",
    "Key differences between Scrum and Kanban",
    "Specifics of testing in blockchain projects"
  ]
}}
\`\`\`

Transcription Text:
{transcript}`,
);

/**
 * Prompt to fix invalid JSON output from topicExtractorPrompt.
 */
export const fixTopicExtractorJsonPrompt = PromptTemplate.fromTemplate(
    `You are a JSON correction agent. A previous step failed to produce valid JSON.
Your task is to correct the invalid JSON based on the provided error.
Ensure the output STRICTLY follows this format:
{{
  "topics": ["...", "...", "..."]
}}
- The value for "topics" MUST be an array of strings.
- Ensure all text remains in the original language (likely Russian based on example).
- Return ONLY the corrected, valid JSON object.

The Error:
{error}

The Invalid JSON you produced:
{rawOutput}

Corrected JSON:`,
);
