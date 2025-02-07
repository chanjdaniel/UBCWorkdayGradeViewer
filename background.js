chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.tables) {
        console.log("Extracted Table Data:", message.tables);
    }
});
