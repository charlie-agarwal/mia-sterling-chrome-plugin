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

// Run when the page loads
window.addEventListener('load', () => {
    if (window.location.href.includes('goodreads.com/author/dashboard')) {
        setTimeout(extractGoodreadsStats, 2000);
    } else if (window.location.href.includes('author.amazon.com')) {
        setTimeout(extractFollowerCount, 2000);
    }
});

// Listen for requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_FOLLOWER_COUNT') {
        extractFollowerCount();
    } else if (request.type === 'GET_GOODREADS_STATS') {
        extractGoodreadsStats();
    }
    // Send response to keep the message channel open
    sendResponse({ received: true });
    return true;
});