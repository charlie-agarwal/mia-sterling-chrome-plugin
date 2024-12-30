// Background script to handle automatic data fetching
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.type, message.data);

    if (message.data && message.data.error === 'Login required') {
        console.log('Login required for BookBub');
        // Could handle opening the login page here
        return;
    }

    // If we got follower data and the source was a background tab we created,
    // we can close that tab now
    if ((message.type === 'FOLLOWER_DATA' ||
        message.type === 'GOODREADS_DATA' ||
        message.type === 'BOOKBUB_DATA') &&
        sender.tab && !sender.tab.active) {

        setTimeout(() => {
            console.log('Closing background tab:', sender.tab.id);
            chrome.tabs.remove(sender.tab.id).catch(err => {
                console.log('Error closing tab:', err);
            });
        }, 2000);
    }
});