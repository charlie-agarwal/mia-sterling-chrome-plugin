// Background script to handle automatic data fetching
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.type);

    // If we got follower data or Goodreads data and the source was a background tab we created,
    // we can close that tab now
    if ((message.type === 'FOLLOWER_DATA' || message.type === 'GOODREADS_DATA') &&
        sender.tab && !sender.tab.active) {
        console.log('Closing background tab:', sender.tab.id);
        chrome.tabs.remove(sender.tab.id);
    }
});