chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
