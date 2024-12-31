# Author Stats Tracker Chrome Extension

A Chrome extension that automatically collects and tracks author statistics from multiple platforms including Amazon Author Central, Goodreads, BookBub, Instagram, and Facebook.

## Features

- Tracks follower counts across multiple platforms:
  - Amazon Author Central followers
  - Goodreads followers and ratings
  - BookBub followers
  - Instagram followers
  - Facebook followers
- Automatically refreshes data when older than 1 hour
- Sends consolidated stats to a local API endpoint
- Clean, easy-to-read popup interface
- Background tab automation (opens and closes tabs automatically)

## Installation

1. Clone this repository or download the source code

``` bash
git clone [repository-url]
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the directory containing the extension files

## Required Files

Make sure you have all these files in your extension directory:
- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `content.js` - Content script for data extraction
- `background.js` - Background script for data processing
- `icon48.png` - Extension icon (48x48)
- `icon128.png` - Extension icon (128x128)

## Configuration

1. Update the author URLs in the code to match your author profiles:
   - In `popup.js`, modify the URLs for each platform:
     ```javascript
     // Instagram URL
     url: 'https://www.instagram.com/your.author.profile/'
     
     // Facebook URL
     url: 'https://www.facebook.com/your.author.profile'
     ```

2. Set up the local API endpoint:
   - The extension expects an API endpoint at `http://127.0.0.1:5000/api/followers`
   - The API should accept POST requests with JSON data
   - Modify the API URL in `background.js` if needed

## Usage

1. Click the extension icon in Chrome to view your current stats

2. Use the "Refresh" buttons to manually update stats for each platform

3. Stats will automatically refresh when:
   - The popup is opened
   - The existing data is older than 1 hour

## API Data Format

The extension sends data to the API in the following format:

```json
{
    "amazon_followers": 1000,
    "goodreads_followers": 2000,
    "goodreads_avg_rating": 4.5,
    "goodreads_total_ratings": 500,
    "goodreads_reviews": 300,
    "bookbub_followers": 1500,
    "facebook_followers": 5000,
    "instagram_followers": 3000
}
```

## Permissions

The extension requires the following permissions:
- `activeTab` - To interact with the current tab
- `storage` - To store stats data locally
- `scripting` - To inject content scripts
- `tabs` - To manage tabs for data collection

## Notes

- Some platforms may require you to be logged in to access the data
- The extension automatically closes background tabs after collecting data
- Data is stored locally and refreshed hourly
- Make sure your API endpoint is running before using the extension

## Troubleshooting

1. If stats aren't updating:
   - Check if you're logged into the respective platforms
   - Verify the URLs match your author profiles
   - Check the browser console for error messages

2. If the API isn't receiving data:
   - Ensure your local API server is running
   - Check the API endpoint URL is correct
   - Verify network connectivity

## Contributing

Feel free to submit issues and enhancement requests!

## License

[Your chosen license]
