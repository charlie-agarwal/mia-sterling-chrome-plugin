// Function to extract follower count
function extractFollowerCount() {
    const metricsElement = document.querySelector('.metrics');
    if (metricsElement) {
        const followerCount = metricsElement.textContent.trim();
        const dateElement = document.querySelector('.as-of-date');
        const asOfDate = dateElement ? dateElement.textContent.trim() : 'Date not found';

        // Store the data
        chrome.storage.local.set({
            'followerData': {
                count: followerCount,
                date: asOfDate,
                lastUpdated: new Date().toISOString()
            }
        }, function () {
            // Notify popup if it's open
            chrome.runtime.sendMessage({
                type: 'FOLLOWER_DATA',
                data: {
                    count: followerCount,
                    date: asOfDate
                }
            });
        });
    } else {
        // If we're not on the reports page, redirect
        if (!window.location.href.includes('/marketingAndReports')) {
            window.location.href = 'https://author.amazon.com/marketingAndReports';
        }
    }
}

// Function to extract Goodreads stats with retry mechanism
function extractGoodreadsStats() {

    // Function to check if page is ready
    function isPageReady() {
        const statsBox = document.getElementById('authorStatsBox');
        return statsBox && statsBox.querySelector('.minirating');
    }

    // Function to extract data once page is ready
    function extract() {
        const statsBox = document.getElementById('authorStatsBox');

        if (statsBox) {
            // Get all infoBoxRowTitle elements
            const rows = statsBox.querySelectorAll('.infoBoxRowTitle');

            const stats = {
                avgRating: '0',
                totalRatings: '0',
                followers: '0',
                totalReviews: '0',
                totalBooks: '0'
            };

            // Extract rating and total ratings from minirating
            const minirating = statsBox.querySelector('.minirating');
            if (minirating) {
                const ratingMatch = minirating.textContent.match(/(\d+\.\d+) avg/);
                const ratingsMatch = minirating.textContent.match(/— ([\d,]+) ratings/);
                stats.avgRating = ratingMatch ? ratingMatch[1] : '0';
                stats.totalRatings = ratingsMatch ? ratingsMatch[1] : '0';
            }

            // Extract other stats
            rows.forEach(row => {
                const title = row.textContent.trim();
                const value = row.nextElementSibling?.textContent.trim() || '0';

                switch (title) {
                    case 'followers':
                        stats.followers = value;
                        break;
                    case 'total reviews':
                        stats.totalReviews = value;
                        break;
                    case 'number of works':
                        stats.totalBooks = value;
                        break;
                }
            });

            // Store and send the data
            chrome.storage.local.set({
                'goodreadsData': {
                    ...stats,
                    lastUpdated: new Date().toISOString()
                }
            }, function () {
                chrome.runtime.sendMessage({
                    type: 'GOODREADS_DATA',
                    data: stats
                }, response => {
                    console.log('Message sent response:', response);
                });
            });
        } else {
            console.error('Could not find statsBox element');
        }
    }

    // Check if page is ready every 500ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total

    function tryExtract() {
        if (isPageReady()) {
            extract();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryExtract, 500);
        } else {
            console.error('Gave up waiting for page to load');
        }
    }

    tryExtract();
}

// Add this function for BookBub stats extraction
function extractBookbubStats() {
    console.log('Attempting to extract BookBub stats');

    // Check if we need to log in
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        console.log('Login form detected, need to authenticate first');
        chrome.runtime.sendMessage({
            type: 'BOOKBUB_DATA',
            data: {
                error: 'Login required',
                followers: 'Login required'
            }
        });
        return;
    }

    // Function to check if page is ready
    function isPageReady() {
        const followersTitle = document.querySelector('.followers-title');
        const followerCount = document.querySelector('.follower-count');
        const isReady = followersTitle && followerCount;
        console.log('Page ready check:', {
            hasTitle: !!followersTitle,
            hasCount: !!followerCount,
            isReady: isReady,
            url: window.location.href,
            bodyClasses: document.body.className
        });
        return isReady;
    }

    // Function to extract data once page is ready
    function extract() {
        const followerCount = document.querySelector('.follower-count');
        console.log('Found follower count element:', followerCount?.textContent);

        if (followerCount) {
            const followers = followerCount.textContent.trim();
            console.log('Extracted followers count:', followers);

            // Store the data
            chrome.storage.local.set({
                'bookbubData': {
                    followers: followers,
                    lastUpdated: new Date().toISOString()
                }
            }, function () {
                // Notify popup and wait for confirmation
                chrome.runtime.sendMessage({
                    type: 'BOOKBUB_DATA',
                    data: {
                        followers: followers
                    }
                }, response => {
                    console.log('Data sent successfully:', response);
                });
            });
        } else {
            console.error('Could not find BookBub followers element');
            // Log the current page state
            console.log('Current page structure:', {
                hasFollowersTitle: !!document.querySelector('.followers-title'),
                hasFollowerCount: !!document.querySelector('.follower-count'),
                pageUrl: window.location.href,
                html: document.body.innerHTML.substring(0, 1000) // First 1000 chars for debugging
            });
        }
    }

    // Wait for the page to load with increased timeout
    setTimeout(() => {
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds total

        function tryExtract() {
            console.log(`Attempt ${attempts + 1} to extract BookBub stats`);
            if (isPageReady()) {
                console.log('Page is ready, extracting data');
                extract();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(tryExtract, 500);
            } else {
                console.error('Gave up waiting for BookBub page to load');
            }
        }

        tryExtract();
    }, 5000); // Wait 5 seconds before starting extraction attempts
}

// Add this function for Instagram stats extraction
function extractInstagramStats() {
    console.log('Attempting to extract Instagram stats');

    const followerElements = document.querySelectorAll('a[href$="/followers/"] span.html-span');
    if (followerElements.length > 0) {
        const followers = followerElements[0].textContent.trim();
        console.log('Found Instagram followers:', followers);

        // Store and send the data
        chrome.storage.local.set({
            'instagramData': {
                followers: followers,
                lastUpdated: new Date().toISOString()
            }
        }, function () {
            chrome.runtime.sendMessage({
                type: 'INSTAGRAM_DATA',
                data: {
                    followers: followers
                }
            });
        });
    } else {
        console.error('Could not find Instagram followers element');
    }
}

// Add this function for Facebook stats extraction
function extractFacebookStats() {
    console.log('Attempting to extract Facebook stats');

    const followerElements = document.querySelectorAll('a[href$="/followers/"]');
    if (followerElements.length > 0) {
        const followerText = followerElements[0].textContent.trim();
        const followers = followerText.split(' ')[0]; // Extract number from "95 followers"
        console.log('Found Facebook followers:', followers);

        // Store and send the data
        chrome.storage.local.set({
            'facebookData': {
                followers: followers,
                lastUpdated: new Date().toISOString()
            }
        }, function () {
            chrome.runtime.sendMessage({
                type: 'FACEBOOK_DATA',
                data: {
                    followers: followers
                }
            });
        });
    } else {
        console.error('Could not find Facebook followers element');
    }
}

// Add immediate logging when script loads
console.log('Content script loaded on:', window.location.href);

// Run when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content loaded:', window.location.href);
});

window.addEventListener('load', () => {
    console.log('Page fully loaded:', window.location.href);
    if (window.location.href.includes('partners.bookbub.com')) {
        console.log('On BookBub partners page, waiting before extraction');
        setTimeout(extractBookbubStats, 2000);
    }
    // ... rest of the event listener
});

// Listen for requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_FOLLOWER_COUNT') {
        extractFollowerCount();
    } else if (request.type === 'GET_GOODREADS_STATS') {
        extractGoodreadsStats();
    } else if (request.type === 'GET_BOOKBUB_STATS') {
        extractBookbubStats();
    } else if (request.type === 'GET_INSTAGRAM_STATS') {
        extractInstagramStats();
    } else if (request.type === 'GET_FACEBOOK_STATS') {
        extractFacebookStats();
    }
    // Send response to keep the message channel open
    sendResponse({ received: true });
    return true;
});