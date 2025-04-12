import {log} from "./logger.ts";
import {TranscriptController} from "./content_scripts/controller/transcript_controller.ts";

chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
    console.log('Message received:', request);
    if (request.url && request.options) {
        console.log('Fetching from URL:', request.url);
        fetch(request.url, request.options)
            .then(response => {
                console.log('Response received:', response);
                return response.text();
            })
            .then(text => {
                console.log('Response text:', text);
                try {
                    const json = JSON.parse(text);
                    console.log('Parsed JSON:', json);
                    sendResponse(json);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    sendResponse({ error: 'Failed to parse JSON: ' + text });
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                sendResponse({ error: error.message });
            });
        return true; // Will respond asynchronously.
    }
});

const controller = new TranscriptController();
// Set up a background script to act as a proxy for fetch requests to UNC systems
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'fetchTranscriptData') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchTranscriptData' }, () => {
                    // Fetch data asynchronously, THEN send the response
                    controller.fetchData().then(() => {
                        const summary = controller.getSummary();
                        sendResponse({ success: true, data: summary }); // NOW it's inside the Promise chain
                    }).catch(error => {
                        log.error('Error fetching data:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                });
            } else {
                sendResponse({ success: false, error: "No active tab found" });
            }
        });
        return true; // REQUIRED for async sendResponse
    }
});

log.debug("Running from Background Script...")