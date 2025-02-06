document.getElementById("extract").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"]
        });
    });
});

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message) => {
    displayContent = {};
    if (message.tables) {
        displayContent["tables"] = message.tables;
    }
    if (message.periods) {
        displayContent["periods"] = message.periods;
    }
    document.getElementById("output").textContent = JSON.stringify(displayContent, null, 2);
});