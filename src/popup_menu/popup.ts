// popup.ts

import {log} from "../logger.ts";
import {TranscriptSummaryData} from "../types.ts";

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-tooltips');
    const requestsLastSearch = document.getElementById('requests-last-search');
    const requestsLifetime1 = document.getElementById('requests-lifetime-1');
    const requestsLifetime2 = document.getElementById('requests-lifetime-2');

    // Default state
    let tooltipsEnabled = false;

    // Load saved state from storage
    chrome.storage.sync.get(['tooltipsEnabled', 'requestsLastSearch', 'requestsLifetime1', 'requestsLifetime2'], (result) => {
        tooltipsEnabled = result.tooltipsEnabled || false;
        updateButton();

        // Update stats from storage, with null checks
        if (requestsLastSearch) {
            requestsLastSearch.textContent = result.requestsLastSearch || 0;
        }
        if (requestsLifetime1) {
            requestsLifetime1.textContent = result.requestsLifetime1 || 0;
        }
        if (requestsLifetime2) {
            requestsLifetime2.textContent = result.requestsLifetime2 || 0;
        }
    });

    // Toggle button click event, with null check
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            tooltipsEnabled = !tooltipsEnabled;
            chrome.storage.sync.set({ tooltipsEnabled });
            updateButton();
        });
    }

    // Update button text based on the current state, with null check
    function updateButton() {
        if (toggleButton) {
            toggleButton.textContent = `Tooltips: ${tooltipsEnabled ? 'ON' : 'OFF'}`;
        }
    }
});


// --- Constants ---
const PLACEHOLDER_TEXT = "N/A"; // Or "visit New ConnectCarolina..." if preferred as default
const STORAGE_KEY = 'transcriptSummaryData'; // Key for chrome.storage.local

// --- DOM Element References ---
const statusDiv = document.getElementById('transcript-status') as HTMLDivElement;
const dataDiv = document.getElementById('transcript-data') as HTMLDivElement;
const actionDiv = document.getElementById('transcript-action') as HTMLDivElement;
const gpaSpan = document.getElementById('transcript-gpa') as HTMLSpanElement;
const careerEarnedSpan = document.getElementById('transcript-career-earned') as HTMLSpanElement;
const transferEarnedSpan = document.getElementById('transcript-transfer-earned') as HTMLSpanElement;
const majorsSpan = document.getElementById('transcript-majors') as HTMLSpanElement;
const subplansSpan = document.getElementById('transcript-subplans') as HTMLSpanElement;
const refreshButton = document.getElementById('force-refresh-button') as HTMLButtonElement;

// --- Helper Function to Update Popup UI ---
function updatePopupUI(
    summary: TranscriptSummaryData | null,
    isLoading: boolean,
    error: string | null,
    showActionPrompt: boolean
): void {

    // Hide all sections initially
    statusDiv.style.display = 'none';
    dataDiv.style.display = 'none';
    actionDiv.style.display = 'none';

    if (isLoading) {
        statusDiv.textContent = "Loading...";
        statusDiv.style.display = 'block';
    } else if (error) {
        statusDiv.textContent = `Error: ${error}`;
        statusDiv.style.display = 'block';
        // Optionally show refresh button on error
        actionDiv.style.display = 'block';
        const actionText = actionDiv.querySelector('p em');
        if(actionText) actionText.textContent = "Could not fetch data. Ensure you are logged into ConnectCarolina.";
        refreshButton.style.display = 'inline-block'; // Ensure button is visible
    } else if (summary) {
        // Format and display data
        gpaSpan.textContent = summary.cumGpa?.toFixed(3) ?? PLACEHOLDER_TEXT;
        careerEarnedSpan.textContent = summary.careerEarned?.toString() ?? PLACEHOLDER_TEXT;
        transferEarnedSpan.textContent = summary.transferEarned?.toString() ?? PLACEHOLDER_TEXT;

        majorsSpan.textContent = summary.majors.length > 0
            ? summary.majors.join(', ')
            : PLACEHOLDER_TEXT;
        subplansSpan.textContent = summary.subplans.length > 0
            ? summary.subplans.join(', ')
            : PLACEHOLDER_TEXT;

        dataDiv.style.display = 'block';

        // Decide if action prompt is needed (e.g., if data is present but potentially stale)
        if (showActionPrompt) {
            actionDiv.style.display = 'block';
            const actionText = actionDiv.querySelector('p em');
            if(actionText) actionText.textContent = "Data loaded from cache. Visit the transcript page or refresh if needed.";
            refreshButton.style.display = 'inline-block'; // Allow refresh even with cached data
        } else {
            refreshButton.style.display = 'none'; // Hide refresh if data is fresh/just fetched
        }

    } else if (showActionPrompt) {
        // No summary, but we know we need to prompt the user
        statusDiv.textContent = "No data found.";
        statusDiv.style.display = 'block';
        actionDiv.style.display = 'block';
        const actionText = actionDiv.querySelector('p em');
        if(actionText) actionText.textContent = `Visit the New ConnectCarolina unofficial transcript page to fetch data.`;
        refreshButton.style.display = 'inline-block'; // Show refresh button
    } else {
        // Default state if nothing else matches (should ideally not happen)
        statusDiv.textContent = "Please open the extension on the ConnectCarolina transcript page.";
        statusDiv.style.display = 'block';
    }
}


// --- Function to Request Data from Background Script ---
async function requestDataFromBackground(): Promise<TranscriptSummaryData> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'fetchTranscriptData' }, (response) => {
            if (chrome.runtime.lastError) {
                // Handle errors like the background script not being ready
                log.debug("Message sending error:", chrome.runtime.lastError.message);
                reject(new Error(chrome.runtime.lastError.message || "Could not connect to background script."));
            } else if (response !instanceof Promise) {
                // Handle unexpected response structure
                log.debug("Unexpected response:", response);
                reject(new Error("Received an unexpected response from the background script." + response));
            } else if (response.success) {
                resolve(response.data)
            }
        });
    });
}

// --- Main Logic ---
async function loadAndDisplayData(forceRefresh = false): Promise<void> {
    updatePopupUI(null, true, null, false); // Initial loading state

    try {
        let summaryData: TranscriptSummaryData | null = null;
        let needsActionPrompt = false;

        // 1. Try loading from storage unless forcing refresh
        if (!forceRefresh) {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            if (result[STORAGE_KEY]) {
                console.log("Loaded data from storage");
                summaryData = result[STORAGE_KEY] as TranscriptSummaryData;
                needsActionPrompt = true; // Data is from cache, might be old
            }
        }

        // 2. If no data in storage OR forcing refresh, fetch from background
        if (!summaryData || forceRefresh) {
            console.log(forceRefresh ? "Forcing refresh..." : "No data in storage, fetching...");
            try {
                summaryData = await requestDataFromBackground();
                console.log("Fetched data successfully:", summaryData);
                // Store fetched data
                await chrome.storage.local.set({ [STORAGE_KEY]: summaryData });
                console.log("Stored fetched data in storage.");
                needsActionPrompt = false; // Data is fresh, no prompt needed immediately
            } catch (fetchError: any) {
                console.error("Error fetching data from background:", fetchError);
                // Don't overwrite potentially existing cached data with an error state here,
                // just show the error for this attempt. If summaryData is still null,
                // the UI will reflect that. If we had cached data, we might still show it.
                updatePopupUI(summaryData, false, fetchError.message || "Failed to fetch.", true); // Show error, allow retry
                return; // Exit early on fetch error
            }
        }

        // 3. Update the UI with the final data (either from storage or fresh fetch)
        updatePopupUI(summaryData, false, null, needsActionPrompt);

    } catch (error: any) {
        // Catch errors related to storage access itself or unexpected issues
        console.error("Error in loadAndDisplayData:", error);
        updatePopupUI(null, false, error.message || "An unexpected error occurred.", true); // Show general error
    }
}

// --- Event Listeners ---

// Run when the popup HTML has finished loading
document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayData(); // Load data initially (try cache first)
});

// Add listener for the refresh button
if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        log.debug("Refresh button clicked");
        loadAndDisplayData(true); // Force refresh data
    });
} else {
    console.warn("Refresh button element not found.");
}

log.debug("Loaded popup.ts script")