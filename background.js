// background.js

chrome.action.onClicked.addListener((tab) => {
    // Get the user's preference synchronously first
    chrome.storage.local.get(['viewMode'], (result) => {
        const isSidePanelMode = result.viewMode === 'sidePanel';

        if (isSidePanelMode) {
            // Open in Side Panel (Docked)
            chrome.sidePanel.open({ windowId: tab.windowId });
        } else {
            // Open in Floating Window (Default)
            chrome.windows.create({
                url: "popup.html",
                type: "popup",
                width: 600,
                height: 950
            });
        }
    });
});

// Set panel behavior to not open automatically
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
    .catch((error) => console.log(error));