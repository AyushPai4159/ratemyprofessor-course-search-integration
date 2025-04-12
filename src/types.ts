export interface InitialDataResponse {
    career_totals: {
        cum_gpa: number;
        earned: number;
    };
    transfer_totals: {
        earned: number;
    };
}

export interface Program {
    acad_plan_descr: string;
    acad_subplans: {
        acad_subplan_descr: string;
    }[];
}

export interface ProgramsResponse {
    dates: {
        date: string;
        programs: {
            acad_plans: Program[];
        }[];
    }[];
} // --- Type Definition (matching the structure returned by getSummary) ---
export interface TranscriptSummaryData {
    cumGpa: number | null;
    careerEarned: number | null;
    transferEarned: number | null;
    majors: string[];
    subplans: string[];
}