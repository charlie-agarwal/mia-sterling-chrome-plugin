// Background script to handle automatic data fetching
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Add function to get all stored stats
async function getAllStoredStats() {
    return new Promise((resolve) => {
        chrome.storage.local.get([
            'followerData',
            'goodreadsData',
            'bookbubData',
            'instagramData',
            'facebookData'
        ], function (result) {
            const stats = {
                amazon_followers: 0,
                goodreads_followers: 0,
                goodreads_avg_rating: 0,
                goodreads_total_ratings: 0,
                goodreads_reviews: 0,
                bookbub_followers: 0,
                instagram_followers: 0,
                facebook_followers: 0
            };

            if (result.followerData) {
                stats.amazon_followers = parseInt(result.followerData.count.replace(/,/g, '')) || 0;
            }
            if (result.goodreadsData) {
                stats.goodreads_followers = parseInt(result.goodreadsData.followers.replace(/,/g, '')) || 0;
                stats.goodreads_avg_rating = parseFloat(result.goodreadsData.avgRating) || 0;
                stats.goodreads_total_ratings = parseInt(result.goodreadsData.totalRatings.replace(/,/g, '')) || 0;
                stats.goodreads_reviews = parseInt(result.goodreadsData.totalReviews.replace(/,/g, '')) || 0;
            }
            if (result.bookbubData) {
                stats.bookbub_followers = parseInt(result.bookbubData.followers.replace(/,/g, '')) || 0;
            }
            if (result.instagramData) {
                stats.instagram_followers = parseInt(result.instagramData.followers.replace(/,/g, '')) || 0;
            }
            if (result.facebookData) {
                stats.facebook_followers = parseInt(result.facebookData.followers.replace(/,/g, '')) || 0;
            }

            resolve(stats);
        });
    });
}

// Add function to send data to API
async function sendToAPI(newData) {
    try {
        // Get all stored stats first
        const allStats = await getAllStoredStats();

        // Merge new data with stored data
        const completeData = {
            ...allStats,
            ...newData
        };

        console.log('Sending complete data to API:', completeData);

        const response = await fetch('http://127.0.0.1:5000/api/followers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(completeData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Data successfully sent to API');
    } catch (error) {
        console.error('Error sending data to API:', error);
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.type, message.data);

    // Prepare the data to update
    let updateData = {};

    // Update the relevant stats based on message type
    if (message.type === 'FOLLOWER_DATA' && message.data) {
        updateData.amazon_followers = parseInt(message.data.count.replace(/,/g, '')) || 0;
    } else if (message.type === 'GOODREADS_DATA' && message.data) {
        updateData = {
            goodreads_followers: parseInt(message.data.followers.replace(/,/g, '')) || 0,
            goodreads_avg_rating: parseFloat(message.data.avgRating) || 0,
            goodreads_total_ratings: parseInt(message.data.totalRatings.replace(/,/g, '')) || 0,
            goodreads_reviews: parseInt(message.data.totalReviews.replace(/,/g, '')) || 0
        };
    } else if (message.type === 'BOOKBUB_DATA' && message.data) {
        updateData.bookbub_followers = parseInt(message.data.followers.replace(/,/g, '')) || 0;
    } else if (message.type === 'INSTAGRAM_DATA' && message.data) {
        updateData.instagram_followers = parseInt(message.data.followers.replace(/,/g, '')) || 0;
    } else if (message.type === 'FACEBOOK_DATA' && message.data) {
        updateData.facebook_followers = parseInt(message.data.followers.replace(/,/g, '')) || 0;
    }

    // Send complete data to API
    sendToAPI(updateData);

    if (message.data && message.data.error === 'Login required') {
        console.log('Login required for BookBub');
        return;
    }

    // Handle tab closing
    if ((message.type === 'FOLLOWER_DATA' ||
        message.type === 'GOODREADS_DATA' ||
        message.type === 'BOOKBUB_DATA' ||
        message.type === 'INSTAGRAM_DATA' ||
        message.type === 'FACEBOOK_DATA') &&
        sender.tab && !sender.tab.active) {

        setTimeout(() => {
            console.log('Closing background tab:', sender.tab.id);
            chrome.tabs.remove(sender.tab.id).catch(err => {
                console.log('Error closing tab:', err);
            });
        }, 2000);
    }
});