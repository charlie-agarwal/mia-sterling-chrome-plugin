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
            console.log('Follower data saved');
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
        console.log('Could not find metrics element');
        // If we're not on the reports page, redirect
        if (!window.location.href.includes('/marketingAndReports')) {
            console.log('Redirecting to reports page...');
            window.location.href = 'https://author.amazon.com/marketingAndReports';
        }
    }
}

// Run when the page loads
window.addEventListener('load', () => {
    // Wait a bit for dynamic content to load
    setTimeout(extractFollowerCount, 2000);
});

// Listen for requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_FOLLOWER_COUNT') {
        extractFollowerCount();
    }
});