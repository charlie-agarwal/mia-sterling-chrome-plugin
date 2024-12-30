// Background script to handle automatic data fetching
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Add function to send data to API
async function sendToAPI(data) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/followers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Data successfully sent to API');
    } catch (error) {
        console.error('Error sending data to API:', error);
    }
}

// Store the latest stats
let latestStats = {
    amazon_followers: 0,
    goodreads_followers: 0,
    goodreads_avg_rating: 0,
    goodreads_total_ratings: 0,
    goodreads_reviews: 0,
    bookbub_followers: 0,
    instagram_followers: 0
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.type, message.data);

    // Update the relevant stats based on message type
    if (message.type === 'FOLLOWER_DATA' && message.data) {
        latestStats.amazon_followers = parseInt(message.data.count.replace(/,/g, '')) || 0;
    } else if (message.type === 'GOODREADS_DATA' && message.data) {
        latestStats.goodreads_followers = parseInt(message.data.followers.replace(/,/g, '')) || 0;
        latestStats.goodreads_avg_rating = parseFloat(message.data.avgRating) || 0;
        latestStats.goodreads_total_ratings = parseInt(message.data.totalRatings.replace(/,/g, '')) || 0;
        latestStats.goodreads_reviews = parseInt(message.data.totalReviews.replace(/,/g, '')) || 0;
    } else if (message.type === 'BOOKBUB_DATA' && message.data) {
        latestStats.bookbub_followers = parseInt(message.data.followers.replace(/,/g, '')) || 0;
    }

    // Send data to API whenever we receive new stats
    sendToAPI(latestStats);

    if (message.data && message.data.error === 'Login required') {
        console.log('Login required for BookBub');
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