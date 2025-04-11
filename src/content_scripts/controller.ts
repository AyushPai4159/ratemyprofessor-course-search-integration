import { handleOldSite } from './handlers/old_version_handler.js';
import {getIframeDocument} from "./utils/dom_utils.js";
import {handleNewSite} from "./handlers/new_version_handler.ts";
import {log} from "../logger.ts";
let lastCount: string = "";
let isRunning = false;

function detectSiteVersion() {
    // You can inspect DOM patterns unique to the old/new layout
    return 'new'; // or 'new'
}

function checkAndRun() {
    log.debug("Running Script...")
    if (detectSiteVersion() == "old") {
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

            const handler = siteVersion === 'old' ? handleOldSite : handleNewSite; // TODO fix

            handler()
                .catch(console.error)
                .finally(() => {
                    isRunning = false;
                    console.log("RMP injection completed.");
                });
        }
    } else if (detectSiteVersion() == "new") {
        const handler: Promise<any> = handleNewSite();

        handler.catch(console.error)
            .then(() => {
                isRunning = false;
                // console.log("RMP injection completed.");
            }, (error) => {
                log.debug("RMP injection failed with error: ", error);
            });
    }
}

setInterval(checkAndRun, 500);
log.debug("Running from controller")