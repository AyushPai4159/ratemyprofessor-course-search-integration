import { handleOldSite } from './handlers/old_version_handler.js';
import {getIframeDocument} from "./utils/dom_utils.js";
import {handleNewSite} from "./handlers/new_version_handler.ts";
import {log} from "../logger.ts";
let lastCount: string = "";
let isRunning = false;

export function determineSiteType() {
    const url = window.location.href;

    // Extract the part of the URL that contains /s/ or /c/
    const pathMatch = url.match(/\/[s|c]\//);

    if (!pathMatch) {
        return null; // Default case if neither /s/ nor /c/ is found
    }

    switch (pathMatch[0]) {
        case '/c/':
            return 'old';
        case '/s/':
            return 'new';
        default:
            return null;
    }
}

function checkAndRun() {
    log.verbose("Running Script...")
    let handler: Promise<void>;

    if (determineSiteType() === "old") {
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
        }

        handler = handleOldSite();

    } else if (determineSiteType() === "new") {
        handler = handleNewSite();
    } else {
        handler = new Promise(() => {})
    }

    handler.catch(console.error)
        .then(() => {
            isRunning = false;
            // console.log("RMP injection completed.");
        }, (error) => {
            log.verbose("RMP injection failed with error: ", error);
        });
}

setInterval(checkAndRun, 500);
log.verbose("Running from controller")