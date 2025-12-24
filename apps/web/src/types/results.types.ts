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
    reason?: string;
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

export interface FullReport {
    interviewId?: string;
    candidateId?: string;
    cvSummary: CvSummary;
    valuesFit: ValuesFit;
    technicalAssessment: TechnicalAssessment;
    languageAssessment: LanguageAssessment;
    aiSummary: AiSummary;
    overallConclusion: OverallConclusion;
}

export interface JobHistoryEntry {
    jobName: string;
    status: 'success' | 'failed';
    timestamp: string;
}

export interface AnalysisMetadata {
    jobId: string;
    jobHistory: JobHistoryEntry[];
}

export interface ResultsAnalysisResponse {
    message: string;
    success: boolean;
    report: FullReport;
    metadata?: AnalysisMetadata;
}

export interface StartAnalysisResponse {
    job_id: string;
    status: string;
    message: string;
}

export type JobStatusResponse = {
    job_id: string;
    status: string;
    result: ResultsAnalysisResponse | null;
    error: string | null;
};
