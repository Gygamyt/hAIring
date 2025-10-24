export interface CvSummary {
    fullName: string;
    location: string;
    summary: string;
    skills: string[];
    yearsOfExperience: number;
}

export interface AssessedValue {
    value: string;
    match: string;
    evidence: string;
}

export interface ValuesFit {
    overallSummary: string;
    assessedValues: AssessedValue[];
}

export interface TopicAssessment {
    topic: string;
    grade: string;
    summary: string;
}

export interface TechnicalAssessment {
    knowledgeDepth: string;
    practicalExperience: string;
    problemSolving: string;
    summary: string;
    topicAssessments: TopicAssessment[];
}

export interface LanguageAssessment {
    assessmentSkipped: boolean;
    overallLevel: string;
    fluency: string;
    vocabulary: string;
    pronunciation: string;
    summary: string;
}

export interface AiSummary {
    overallSummary: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
}

export interface OverallConclusion {
    recommendation: string;
    finalJustification: string;
    keyPositives: string[];
    keyConcerns: string[];
}

// ЭТО НАШ НОВЫЙ "ГЛАВНЫЙ" ОТЧЕТ
export interface FullReport {
    cvSummary: CvSummary;
    valuesFit: ValuesFit;
    technicalAssessment: TechnicalAssessment;
    languageAssessment: LanguageAssessment;
    aiSummary: AiSummary;
    overallConclusion: OverallConclusion;
}

// ----- СТАРЫЕ ТИПЫ, КОТОРЫЕ УЖЕ ПРАВИЛЬНЫЕ -----

// DTO-ответ, который лежит ВНУТРИ 'result' при успехе
export interface ResultsAnalysisResponse {
    message: string;
    success: boolean;
    report: FullReport; // <-- Теперь использует новый FullReport
}

// DTO-ответ от API при ЗАПУСКЕ задачи
export interface StartAnalysisResponse {
    job_id: string;
    status: string;
    message: string;
}

// DTO-ответ от API при ОПРОСЕ статуса
export type JobStatusResponse = {
    job_id: string;
    status: string; // "completed", "pending", "failed", etc.
    result: ResultsAnalysisResponse | null; // <-- Отчет вложен здесь
    error: string | null;
};