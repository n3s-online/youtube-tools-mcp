# YouTube Data API v3 Setup Guide

This guide will help you set up the YouTube Data API v3 to enable search functionality in the YouTube Tools MCP Server.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top of the page
4. Click "New Project"
5. Enter a project name (e.g., "YouTube Tools MCP")
6. Click "Create"

## Step 2: Enable the YouTube Data API v3

1. In the Google Cloud Console, make sure your new project is selected
2. Go to the [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard)
3. Click "Enable APIs and Services" at the top
4. Search for "YouTube Data API v3"
5. Click on "YouTube Data API v3" from the results
6. Click "Enable"

## Step 3: Create API Credentials

1. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" at the top
3. Select "API key"
4. Your API key will be created and displayed
5. **Important**: Copy this API key immediately and store it securely

## Step 4: Configure API Key (Optional but Recommended)

For security, you should restrict your API key:

1. Click on the API key you just created
2. Under "API restrictions", select "Restrict key"
3. Check "YouTube Data API v3"
4. Under "Application restrictions", you can:
   - Select "None" for development/testing
   - Select "HTTP referrers" and add your domain for web apps
   - Select "IP addresses" and add your server IP for server apps
5. Click "Save"

## Step 5: Add API Key to Your Environment

1. In your YouTube Tools MCP project, create or edit the `.env` file
2. Add your API key:
   ```env
   YOUTUBE_API_KEY=your_api_key_here
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```
3. Save the file

## Step 6: Test Your Setup

Run the test script to verify your API key works:

```bash
pnpm run test-search
```

## Quota and Limits

The YouTube Data API v3 has the following default quotas:

- **Daily quota**: 10,000 units per day (free tier)
- **Search requests**: 100 units per request
- **Rate limit**: 100 requests per 100 seconds per user

This means you can perform approximately 100 searches per day with the free tier.

### Quota Usage by Operation

- **Search videos**: 100 units per request
- **Get video details**: 1 unit per request
- **Get channel details**: 1 unit per request

## Troubleshooting

### Common Errors

**403 Forbidden**
- Check if the YouTube Data API v3 is enabled
- Verify your API key is correct
- Check if you've exceeded your quota

**400 Bad Request**
- Check your search parameters
- Ensure required parameters are provided

**Quota Exceeded**
- Wait until the next day for quota reset
- Consider upgrading to a paid plan for higher quotas

### Getting Help

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Google Cloud Console Support](https://cloud.google.com/support)
- [Stack Overflow - YouTube API](https://stackoverflow.com/questions/tagged/youtube-api)

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables** for API keys
3. **Restrict API keys** to specific APIs and domains/IPs
4. **Rotate API keys** regularly
5. **Monitor usage** in the Google Cloud Console

## Cost Considerations

The YouTube Data API v3 is free up to 10,000 units per day. If you need more:

- **Paid tier**: $0.05 per 1,000 additional units
- **Enterprise**: Contact Google for custom pricing

For most personal and small business use cases, the free tier is sufficient.
