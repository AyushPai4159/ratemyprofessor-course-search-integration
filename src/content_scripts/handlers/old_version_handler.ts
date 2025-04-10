import { generateProfRating } from '../utils/rmp_utils.ts';
import { getIframeDocument, waitForElement } from '../utils/dom_utils.ts';
import $ from "jquery";

export async function handleOldSite() {
    const iframeDoc = getIframeDocument();
    if (!iframeDoc) return;

    const label = await waitForElement(() =>
        iframeDoc.getElementsByClassName("PSGROUPBOXLABEL")[0]
    );

    const numResults = parseInt(label.innerText.replace(/\D/g, ""), 10);

    for (let i = 0; i < numResults; i++) {
        const instructorSpan = iframeDoc.getElementById(`MTG_INSTR$${i}`);
        if (instructorSpan) {
            const name = instructorSpan.innerText.trim();
            if (!name.includes(",")) {
                const html = await generateProfRating(name);
                if (html) $(instructorSpan).after(html);
            }
        }
    }
}