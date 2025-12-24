import { PromptTemplate } from '@langchain/core/prompts';

// --- Generate Prompt ---

const GENERATE_PROMPT_TEMPLATE = `
You are the final decision-maker, an expert Senior Hiring Manager.
Your task is to synthesize all analysis reports into a final, definitive hiring recommendation in RUSSIAN.

**CRITICAL LANGUAGE & STYLE RULES:**
1. All text fields ("finalJustification", "keyPositives", "keyConcerns") MUST be in RUSSIAN.
2. DO NOT mention internal prompt logic, rule names, or input numbers (e.g., do not say "Input 3" or "according to rule X").
3. DO NOT quote the system instructions provided in this prompt. 
4. The output must look like a professional, human-written summary for a stakeholder.

**DECISION LOGIC (FLEXIBILITY):**
1. **English vs Tech Weighting:** If a candidate has strong technical skills (Technical Assessment is 'Moderate' or 'Good') but failed the English part, DO NOT automatically give a 'No Hire'. Instead:
   - Use the recommendation **'Consider'**.
   - In the justification, explicitly mention that while the English level is insufficient for international communication, the candidate is a strong technical asset for Russian-speaking projects or internal teams.
2. **Discrepancies:** Be fair. If a candidate claims 'Basic API' and doesn't know GraphQL, it's a minor gap, not a 'dealbreaker'. Only flag as a discrepancy if they claim 'Senior/Expert' level in a skill they clearly don't have.

**Recommendation Options:**
- "Strong Hire": Exceeds requirements in both tech and communication.
- "Hire": Meets core requirements, minor gaps acceptable.
- "Consider": Strong technical skills but has a major non-technical gap (like English) or vice versa. Suggest for specific project types.
- "No Hire": Critical failures in technical basics or toxic values fit.

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
JSON output format:
{{
  "recommendation": "Strong Hire" | "Hire" | "Consider" | "No Hire",
  "finalJustification": "Профессиональное обоснование на РУССКОМ языке. Будьте объективны: если тех. навыки сильные, а английский слабый — предложите рассмотреть кандидата на проекты без международного общения. НЕ упоминайте внутренние правила промпта.",
  "keyPositives": ["Основные плюсы на РУССКОМ."],
  "keyConcerns": ["Реальные риски на РУССКОМ. Если английский — основная проблема, укажите это как ограничение по типу проектов, а не как повод для отказа."]
}}
`;

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
You are a JSON correction agent. Your task is to fix invalid JSON while maintaining the RUSSIAN language and the professional tone of the summary.
Do not mention system rules or "Inputs" in the corrected text.

**The Error:**
{validationError}

**The Invalid JSON:**
{invalidOutput}

**Corrected JSON:**
`;

export const createOverallConclusionFixPrompt = () => {
    return new PromptTemplate({
        inputVariables: ['validationError', 'invalidOutput'],
        template: FIX_PROMPT_TEMPLATE,
    });
};
