chrome.storage.session.get(["popupWindowId"], (data) => {
    if (!data.popupWindowId) {
        chrome.storage.session.set({ popupWindowId: null });
    }
});

chrome.action.onClicked.addListener((tab) => {
    chrome.storage.session.get(["popupWindowId"], (data) => {
        if (data.popupWindowId) {
            chrome.windows.update(data.popupWindowId, { focused: true }, (window) => {
                if (!window) {
                    createPopupWindow(tab);
                }
            });
        } else {
            createPopupWindow(tab);
        }
    });
});

function createPopupWindow(tab) {
    chrome.windows.create({
        url: "popup.html",
        type: "popup",
        width: 800,
        height: tab.height,
        focused: true
    }, (window) => {
        chrome.storage.session.set({ activeTabId: tab.id });
        chrome.storage.session.set({ popupWindowId: window.id });
    });
}

chrome.windows.onRemoved.addListener((windowId) => {
    chrome.storage.session.get(["popupWindowId"], (data) => {
        if (data.popupWindowId === windowId) {
            chrome.storage.session.remove("popupWindowId");
        }
    });
});
