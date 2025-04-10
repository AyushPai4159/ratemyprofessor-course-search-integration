// popup.ts

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