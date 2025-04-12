import { generateProfRating } from '../utils/rmp_utils.ts';
import { getIframeDocument, waitForElement } from '../utils/dom_utils.ts';
import $ from "jquery";
import {injectCSS} from "../utils/rmp_utils.ts";


export async function handleOldSite() {
    const iframeDoc = getIframeDocument();
    if (!iframeDoc) return;

    injectCSS(iframeDoc, undefined, 'registron-rating-styles'); 

    const label = await waitForElement(() =>
        iframeDoc.getElementsByClassName("PSGROUPBOXLABEL")[0]
    );

    const numResults = parseInt(label.innerText.replace(/\D/g, ""), 10);

    for (let i = 0; i < numResults; i++) {
        const instructorSpan = iframeDoc.getElementById(`MTG_INSTR$${i}`);
        if (instructorSpan === null || instructorSpan.hasAttribute("data-registron-injected")) continue

        instructorSpan.setAttribute("data-registron-injected", "true");
        const professorNames = instructorSpan.innerText.trim();
        console.log(professorNames)
        const htmls = await generateProfRating(professorNames)
        if (htmls === null || htmls.length < 1) continue;
        htmls.forEach((html) => {
            if (html) $(instructorSpan).after(html[0]);
        })
    }
}