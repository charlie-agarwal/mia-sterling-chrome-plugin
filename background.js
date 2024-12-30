// Background script to handle automatic data fetching
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // If we got follower data and the source was a background tab we created,
    // we can close that tab now
    if (message.type === 'FOLLOWER_DATA' && sender.tab && !sender.tab.active) {
        chrome.tabs.remove(sender.tab.id);
    }
});