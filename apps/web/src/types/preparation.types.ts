export interface MatchingItem {
    criterion: string;
    match: string;
    comment: string;
}

export interface Conclusion {
    summary: string;
    recommendations: string;
    interview_topics: string[];
    values_assessment: string;
}

export interface Report {
    first_name: string | null;
    last_name: string | null;
    matching_table: MatchingItem[];
    candidate_profile: string;
    conclusion: Conclusion;
}

export interface PreparationAnalysisResponse {
    message: string;
    success: boolean;
    report: Report;
}
