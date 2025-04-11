import {checkNameMatch, searchProfessor} from './data_utils.ts';
import {log} from "../../logger.ts";

const schoolID = 1232;
const schoolNameWebEncoded = 'The%20University%20of%20North%20Carolina%20at%20Chapel%20Hill';

export async function generateProfRating(professorsInput: string): Promise<string[] | null> {
        // Split the input string by comma, newline, or multiple whitespace
        // and filter out empty strings
        const professorNames = professorsInput
            .split(/[\n,]+|\s{2,}/) // Split by comma, newline, or multiple whitespace
            .map(name => name.trim()) // Trim whitespace from each name
            .filter(name => name.length > 0 && name != "-" && name != "-None"); // Remove empty entries

        // Process each professor name and collect results
        return await Promise.all(
            professorNames.map(async (fullName) => {
                let result;
                try {
                    result = await searchProfessor(fullName, schoolID, schoolNameWebEncoded);
                } catch (error) {
                    log.error('Error fetching professor data:', error);
                    return createRatingCell(
                        'search',
                        `https://www.ratemyprofessors.com/search/professors/${schoolID}?q=${fullName}`,
                        defaultStyle(true)
                    );
                }

                if (result.numRatings === 0 || !checkNameMatch(result.name, fullName)) {
                    return createRatingCell(
                        'search',
                        `https://www.ratemyprofessors.com/search/professors/${schoolID}?q=${fullName}`
                    );
                }

                const rating = result.avgRating;
                const id = result.id;
                const formattedRating = Number.isInteger(rating) ? rating + '.0' : rating.toString();
                const colorStyle = getRatingStyle(rating);

                return createRatingCell(
                    formattedRating,
                    `https://www.ratemyprofessors.com/professor/${id}`,
                    colorStyle
                );
            })
        );
}

function createRatingCell(content: string, href: string, style: string = defaultStyle(false)): string {
    return `<td style='${style}'><a style='${style} color: white !important;' href="${href}">${content}</a></td>`;
}

function defaultStyle(error: boolean): string {
    return "width: 50px; background-color: " + (error ? 'rgb(204, 0, 0)' : 'rgb(100, 181, 246)') + ";";
}

function getRatingStyle(rating: number): string {
    if (rating >= 4) return "background-color: rgb(76, 175, 80);";
    if (rating >= 3) return "background-color: rgb(255, 235, 59);";
    if (rating >= 2) return "background-color: rgb(255, 152, 0);";
    if (rating >= 1) return "background-color: rgb(244, 67, 54);";
    return "background-color: rgb(183, 28, 28);";
}