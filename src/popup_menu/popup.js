// popup.js

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

        // Update stats from storage
        requestsLastSearch.textContent = result.requestsLastSearch || 0;
        requestsLifetime1.textContent = result.requestsLifetime1 || 0;
        requestsLifetime2.textContent = result.requestsLifetime2 || 0;
    });

    // Toggle button click event
    toggleButton.addEventListener('click', () => {
        tooltipsEnabled = !tooltipsEnabled;
        chrome.storage.sync.set({ tooltipsEnabled });
        updateButton();
    });

    // Update button text based on the current state
    function updateButton() {
        toggleButton.textContent = `Tooltips: ${tooltipsEnabled ? 'ON' : 'OFF'}`;
    }
});