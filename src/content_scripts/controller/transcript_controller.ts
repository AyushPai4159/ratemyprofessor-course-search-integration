// src/content_scripts/controller.ts
import {ProgramsResponse, TranscriptSummaryData} from '../../types';
import {fetchInitialData, fetchPrograms} from "../utils/student_information_data_utils.ts";

export class TranscriptController {
    private cumGpa: number | null = null;
    private careerEarned: number | null = null;
    private transferEarned: number | null = null;
    private majors: string[] = [];
    private subplans: string[] = [];

    async fetchData(): Promise<void> {
        try {
            // Fetch initial data
            const initialData = await fetchInitialData();
            this.cumGpa = initialData.career_totals.cum_gpa;
            this.careerEarned = initialData.career_totals.earned;
            this.transferEarned = initialData.transfer_totals.earned;

            // Fetch programs data
            const programsData = await fetchPrograms();
            this.processPrograms(programsData);
        } catch (error) {
            console.error('Error fetching transcript data:', error);
        }
    }

    private processPrograms(data: ProgramsResponse): void {
        const uniqueMajors = new Set<string>();
        const uniqueSubplans = new Set<string>();

        data.dates.forEach(dateGroup => {
            dateGroup.programs.forEach(program => {
                program.acad_plans.forEach(plan => {
                    // Clean and add major
                    const major = plan.acad_plan_descr
                        .replace('College of Arts and Sciences\r\n', '')
                        .trim();
                    if (major && major !== "Undecided Major") uniqueMajors.add(major);

                    // Add subplans
                    plan.acad_subplans.forEach(subplan => {
                        const cleanSubplan = subplan.acad_subplan_descr.trim();
                        if (cleanSubplan) uniqueSubplans.add(cleanSubplan);
                    });
                });
            });
        });

        this.majors = Array.from(uniqueMajors);
        this.subplans = Array.from(uniqueSubplans);
    }

    getSummary(): TranscriptSummaryData {
        return {
            cumGpa: this.cumGpa,
            careerEarned: this.careerEarned,
            transferEarned: this.transferEarned,
            majors: this.majors,
            subplans: this.subplans,
        };
    }
}