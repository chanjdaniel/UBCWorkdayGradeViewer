chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.tables) {
        console.log("Extracted Table Data:", message.tables);
        // You can store this in chrome.storage or send it to a server
    }
});
