# YouTube Tools MCP Server - Usage Examples

## Setup Instructions

### 1. Install and Build

```bash
pnpm install
pnpm run build
```

### 2. Configure Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "youtube-tools": {
      "command": "node",
      "args": [
        "/absolute/path/to/youtube-tools-mcp/build/index.js"
      ]
    }
  }
}
```

**Important**: Replace `/absolute/path/to/youtube-tools-mcp` with the actual absolute path to your project directory.

### 3. Restart Claude Desktop

After updating the configuration, restart Claude Desktop completely.

## Usage Examples

Once configured, you can use the following prompts in Claude Desktop:

### Basic Transcript Extraction

```
Get the transcript for this YouTube video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### Using Video ID

```
Extract the transcript from YouTube video ID: dQw4w9WgXcQ
```

### Specifying Language

```
Get the Spanish transcript for this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### Different URL Formats

The tool supports various YouTube URL formats:
- Full URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Short URL: `https://youtu.be/dQw4w9WgXcQ`
- Embed URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Video ID only: `dQw4w9WgXcQ`

## Expected Output Format

The tool returns a formatted transcript with:

```
YouTube Transcript for Video ID: dQw4w9WgXcQ
Language: en
Total Segments: 45
Duration: 3:33

--- TRANSCRIPT ---
[0:00] We're no strangers to love
[0:07] You know the rules and so do I
[0:15] A full commitment's what I'm thinking of
...
```

## Common Issues and Solutions

### "No transcript available"

This can happen when:
- The video has transcripts disabled by the creator
- The video is private or unavailable
- The requested language is not available

### "Transcript is disabled"

The video creator has disabled automatic transcripts for this video.

### "Video unavailable"

The video might be:
- Private
- Deleted
- Region-restricted
- Age-restricted

## Testing

You can test the functionality using the included test scripts:

```bash
# Test the YouTube transcript library directly
pnpm run test

# Test the MCP server functionality
pnpm run test-mcp
```

## Troubleshooting

### Server Not Showing Up in Claude

1. Check that the path in your configuration is absolute and correct
2. Ensure the server builds without errors: `pnpm run build`
3. Restart Claude Desktop completely
4. Check Claude's logs for errors (see MCP documentation)

### Tool Calls Failing

1. Verify the server is running: `pnpm start` (should show "YouTube Tools MCP server running on stdio")
2. Check that the video ID or URL is valid
3. Try with a different video that you know has transcripts

## Advanced Usage

### Custom Language Codes

Common language codes you can use:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese

Example:
```
Get the French transcript for this video: https://www.youtube.com/watch?v=example
```
