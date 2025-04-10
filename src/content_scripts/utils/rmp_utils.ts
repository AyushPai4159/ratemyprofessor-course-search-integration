import {checkNameMatch, searchProfessor} from './data_utils.ts';

const schoolID = 1232;
const schoolNameWebEncoded = 'The%20University%20of%20North%20Carolina%20at%20Chapel%20Hill';

export async function generateProfRating(fullName: string) {
    try {
        const result = await searchProfessor(fullName, schoolID, schoolNameWebEncoded); // Cast to the interface or null

        if (!result || result.numRatings === 0 || !checkNameMatch(result.name, fullName)) { // Use non-null assertion after checking for null
            return createRatingCell('search', `https://www.ratemyprofessors.com/search/professors/${schoolID}?q=${fullName}`);
        }

        const rating = result.avgRating;
        const id = result.id;
        const formattedRating = Number.isInteger(rating) ? rating + '.0' : rating.toString();
        const colorStyle = getRatingStyle(rating);

        return createRatingCell(formattedRating, `https://www.ratemyprofessors.com/professor/${id}`, colorStyle);
    } catch (error) {
        console.error('Error fetching professor data:', error);
        return null;
    }
}

function createRatingCell(content: string, href: string, style: string = defaultStyle()): string { // Explicitly type parameters and return
    return `<td ${style}><a style='color: white !important;' href="${href}">${content}</a></td>`;
}

function defaultStyle(): string { // Explicitly type return
    return "style='width: 50px; background-color: rgb(100, 181, 246); ...'";
}

function getRatingStyle(rating: number): string { // Explicitly type parameter and return
    if (rating >= 4) return "style='background-color: rgb(76, 175, 80); ...'";
    if (rating >= 3) return "style='background-color: rgb(255, 235, 59); ...'";
    if (rating >= 2) return "style='background-color: rgb(255, 152, 0); ...'";
    if (rating >= 1) return "style='background-color: rgb(244, 67, 54); ...'";
    return "style='background-color: rgb(183, 28, 28); ...'";
}