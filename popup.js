// Debug helper function
function debugLog(msg) {
    let debugDiv = document.getElementById('debugInfo');
    if (debugDiv) {
        debugDiv.innerHTML += msg + '<br>';
    }
    let status = document.getElementById('status');
    if (status) {
        status.textContent = msg;
    }
}

// Update the popup with follower data
function updatePopup(followerData) {
    document.getElementById('followerCount').textContent = followerData.count;
    document.getElementById('lastUpdate').textContent = 'As of ' + followerData.date;
}

// Check stored data first, then request update
function checkFollowerCount() {

    // First try to get stored data
    chrome.storage.local.get(['followerData'], function (result) {
        if (result.followerData) {
            updatePopup(result.followerData);

            // If data is older than 1 hour, refresh it
            const lastUpdated = new Date(result.followerData.lastUpdated);
            if (Date.now() - lastUpdated.getTime() > 3600000) {
                requestFollowerCount();
            }
        } else {
            requestFollowerCount();
        }
    });
}

// Request follower count from the content script
function requestFollowerCount() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // If we're already on an author.amazon.com page
        if (tabs[0].url.includes('author.amazon.com')) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_FOLLOWER_COUNT' });
        } else {
            // Create a new tab for the reports page
            chrome.tabs.create({
                url: 'https://author.amazon.com/marketingAndReports',
                active: false
            }, function (tab) {
                // Wait for the page to load and the content script to run
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, { type: 'GET_FOLLOWER_COUNT' });
                }, 5000);
            });
        }
    });
}

// Add these functions to popup.js
function updateGoodreadsStats(goodreadsData) {
    if (!goodreadsData) return;

    document.getElementById('avgRating').textContent = goodreadsData.avgRating || 'N/A';
    document.getElementById('totalRatings').textContent = goodreadsData.totalRatings || '0';
    document.getElementById('goodreadsFollowers').textContent = goodreadsData.followers || '0';
    document.getElementById('totalReviews').textContent = goodreadsData.totalReviews || '0';
    document.getElementById('totalBooks').textContent = goodreadsData.totalBooks || '0';
    document.getElementById('goodreadsLastUpdate').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

function checkGoodreadsStats() {
    chrome.storage.local.get(['goodreadsData'], function (result) {
        if (result.goodreadsData) {
            updateGoodreadsStats(result.goodreadsData);

            // If data is older than 1 hour, refresh it
            const lastUpdated = new Date(result.goodreadsData.lastUpdated);
            if (Date.now() - lastUpdated.getTime() > 3600000) {
                requestGoodreadsStats();
            }
        } else {
            requestGoodreadsStats();
        }
    });
}

function requestGoodreadsStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        if (tabs[0].url.includes('goodreads.com/author/dashboard')) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_GOODREADS_STATS' });
        } else {
            chrome.tabs.create({
                url: 'https://www.goodreads.com/author/dashboard',
                active: false
            }, function (tab) {
                // Increase timeout to ensure page loads
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'GET_GOODREADS_STATS'
                    }, response => {
                        console.log('Message sent response:', response);
                    });
                }, 8000); // Increased timeout
            });
        }
    });
}

// Add these functions for BookBub
function updateBookbubStats(bookbubData) {
    if (!bookbubData) return;

    document.getElementById('bookbubFollowers').textContent = bookbubData.followers || '0';
    document.getElementById('bookbubLastUpdate').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

function checkBookbubStats() {
    chrome.storage.local.get(['bookbubData'], function (result) {
        if (result.bookbubData) {
            updateBookbubStats(result.bookbubData);

            // If data is older than 1 hour, refresh it
            const lastUpdated = new Date(result.bookbubData.lastUpdated);
            if (Date.now() - lastUpdated.getTime() > 3600000) {
                requestBookbubStats();
            }
        } else {
            requestBookbubStats();
        }
    });
}

function requestBookbubStats() {
    console.log('Requesting BookBub stats');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log('Current tab:', tabs[0].url);
        if (tabs[0].url.includes('partners.bookbub.com')) {
            console.log('Already on BookBub partners, sending message');
            chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_BOOKBUB_STATS' })
                .catch(err => console.log('Error sending message:', err));
        } else {
            console.log('Creating new BookBub partners tab');
            chrome.tabs.create({
                url: 'https://partners.bookbub.com/',
                active: false
            }, function (tab) {
                console.log('New BookBub tab created:', tab.id);

                // First inject the content script
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }).then(() => {
                    console.log('Content script injected successfully');

                    // Wait for page load
                    setTimeout(() => {
                        console.log('Sending message to BookBub tab');
                        // Check if tab still exists before sending message
                        chrome.tabs.get(tab.id, function (tabInfo) {
                            if (chrome.runtime.lastError) {
                                console.log('Tab was closed:', chrome.runtime.lastError);
                                return;
                            }
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'GET_BOOKBUB_STATS'
                            }).catch(err => console.log('Error sending message:', err));
                        });
                    }, 8000); // Wait 8 seconds
                }).catch(err => {
                    console.error('Failed to inject content script:', err);
                });
            });
        }
    });
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FOLLOWER_DATA') {
        updatePopup(message.data);
    } else if (message.type === 'GOODREADS_DATA' && message.data) {
        updateGoodreadsStats(message.data);
    } else if (message.type === 'BOOKBUB_DATA' && message.data) {
        updateBookbubStats(message.data);
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    checkFollowerCount();
    checkGoodreadsStats();
    checkBookbubStats();
});