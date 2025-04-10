import { handleOldSite } from './handlers/old_version_handler.js';
import {getIframeDocument} from "./utils/dom_utils.js";
// import { handleNewSite } from './handlers/new_version_handler.js'; // future

let lastCount: string = "";
let isRunning = false;

function detectSiteVersion() {
    // You can inspect DOM patterns unique to the old/new layout
    return 'old'; // or 'new'
}

function checkAndRun() {
    console.log("Checking and running site")
    const iframeDoc = getIframeDocument();
    if (!iframeDoc) return;

    const resultLabel = iframeDoc.getElementsByClassName("PSGROUPBOXLABEL")[0];
    if (!resultLabel) return;

    // Type assertion to HTMLElement
    const resultLabelElement = resultLabel as HTMLElement;

    const currentCount = resultLabelElement.innerText.replace(/\D/g, "");
    if (currentCount !== lastCount && !isRunning) {
        lastCount = currentCount;
        isRunning = true;

        console.log("Detected change, injecting RMP...");

        const siteVersion = detectSiteVersion();

        const handler = siteVersion === 'old' ? handleOldSite : handleOldSite; // replace with handleNewSite

        handler()
            .catch(console.error)
            .finally(() => {
                isRunning = false;
                console.log("RMP injection completed.");
            });
    }
}

setInterval(checkAndRun, 500);
console.log("Running from controller")