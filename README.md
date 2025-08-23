# YouTube Tools MCP Server

A powerful Model Context Protocol (MCP) server that enables AI assistants to search YouTube and extract video transcripts. Built with TypeScript and designed for seamless integration with Claude Desktop and other MCP-compatible clients.

## 🎯 What is this?

This MCP server bridges the gap between AI assistants and YouTube content by providing comprehensive YouTube integration capabilities. It allows you to:

- **Search YouTube videos** using the official YouTube Data API v3
- **Extract full transcripts** from any YouTube video (when available)
- **Filter search results** by date, duration, quality, and more
- **Get timestamped transcript segments** for precise referencing
- **Support multiple languages** for international content
- **Handle various YouTube URL formats** automatically

Perfect for content discovery, analysis, research, accessibility, and AI-powered video content workflows.

## ✨ Features

- **🔍 YouTube Video Search**: Search YouTube using the official YouTube Data API v3
- **🎬 YouTube Transcript Extraction**: Get complete transcripts from YouTube videos using RapidAPI
- **🎯 Advanced Search Filters**: Filter by date, duration, quality, view count, and more
- **🔗 Flexible Input Formats**: Supports video IDs, full URLs, short URLs, and embed URLs
- **🌍 Multi-Language Support**: Extract transcripts in different languages when available
- **⚡ Smart Error Handling**: Comprehensive error handling with clear, actionable messages
- **🛠️ MCP Protocol Compliant**: Built with the official MCP SDK for maximum compatibility
- **🔑 Official API Integration**: Uses YouTube Data API v3 and RapidAPI for reliable service
- **💻 CLI Tool Included**: Command-line interface for direct transcript extraction

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Claude Desktop (for usage)
- **YouTube Data API v3 Key** (for search functionality)
- **RapidAPI Account** (for transcript extraction)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd youtube-tools-mcp
   pnpm install
   ```

2. **Set up API Keys:**

   **YouTube Data API v3 (for search):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the YouTube Data API v3
   - Create credentials (API key)
   - Copy your YouTube API key

   **RapidAPI (for transcripts):**
   - Go to [RapidAPI YouTube Transcripts](https://rapidapi.com/8v2FWW4H6AmKw89/api/youtube-transcripts)
   - Subscribe to the API (free tier available)
   - Copy your RapidAPI key

3. **Configure environment:**
   ```bash
   # Create .env file and add your API keys:
   YOUTUBE_API_KEY=your_youtube_api_key_here
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```

4. **Build the project:**
   ```bash
   pnpm run build
   ```

5. **Test your setup:**
   ```bash
   node temp/test-rapidapi.js
   ```

6. **Configure Claude Desktop:**

   Add to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "youtube-tools": {
         "command": "node",
         "args": ["/absolute/path/to/youtube-tools-mcp/build/index.js"]
       }
     }
   }
   ```

   **Important:** Replace `/absolute/path/to/youtube-tools-mcp` with your actual project path.

7. **Restart Claude Desktop** completely.

8. **Test it out!** Try asking Claude:
   ```
   "Get the transcript for this YouTube video: https://www.youtube.com/watch?v=2nkiHeoPTqQ"
   ```

## 💻 CLI Usage

You can also use the included command-line tool:

```bash
# Basic usage
node cli.js 2nkiHeoPTqQ

# With full URL
node cli.js "https://www.youtube.com/watch?v=2nkiHeoPTqQ"

# Specify language
node cli.js 2nkiHeoPTqQ --language es

# Save to file
node cli.js 2nkiHeoPTqQ --output transcript.txt

# JSON format
node cli.js 2nkiHeoPTqQ --json

# Hide timestamps
node cli.js 2nkiHeoPTqQ --no-timestamps

# Show help
node cli.js --help
```

## 📖 Usage Examples

Once configured with Claude Desktop, you can use natural language to interact with YouTube:

### Search Examples

**Basic search:**
```
"Search YouTube for 'javascript tutorial' videos"
```

**Search with filters:**
```
"Find recent React tutorials from the last month, ordered by view count"
```

**Search for specific content:**
```
"Search for Python programming videos that are medium length and high definition"
```

### Transcript Examples

**Get transcript from URL:**
```
"Get the transcript for this YouTube video: https://www.youtube.com/watch?v=2nkiHeoPTqQ"
```

**Use just the video ID:**
```
"Extract transcript from YouTube video ID 2nkiHeoPTqQ"
```

**Specify language:**
```
"Get the Spanish transcript for this video: https://www.youtube.com/watch?v=example"
```

**Works with different URL formats:**
- Full URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Short URL: `https://youtu.be/dQw4w9WgXcQ`
- Embed URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Video ID: `dQw4w9WgXcQ`

## 🔧 Available Tools

### `search_youtube`

Search for YouTube videos using the official YouTube Data API v3.

**Parameters:**
- `query` (required): Search query for YouTube videos
- `maxResults` (optional): Maximum number of results to return (1-50, default: 10)
- `order` (optional): Order of results - "relevance", "date", "rating", "viewCount", "title" (default: "relevance")
- `publishedAfter` (optional): Return videos published after this date (RFC 3339 format)
- `publishedBefore` (optional): Return videos published before this date (RFC 3339 format)
- `videoDuration` (optional): Filter by duration - "any", "short", "medium", "long" (default: "any")
- `videoDefinition` (optional): Filter by definition - "any", "high", "standard" (default: "any")

**Sample Output:**
```
YouTube Search Results for: "javascript tutorial"
📊 Total Results Available: 1000000
📋 Results Returned: 3
🔄 Ordered by: relevance

--- SEARCH RESULTS ---
1. **JavaScript Tutorial for Beginners**
   📺 Channel: Programming with Mosh
   📅 Published: 1/15/2023
   🔗 URL: https://www.youtube.com/watch?v=W6NZfCO5SIk
   📝 Video ID: W6NZfCO5SIk
   📄 Description: Learn JavaScript fundamentals in this comprehensive tutorial...

2. **Modern JavaScript Course**
   📺 Channel: The Net Ninja
   📅 Published: 3/22/2023
   🔗 URL: https://www.youtube.com/watch?v=iWOYAxlnaww
   📝 Video ID: iWOYAxlnaww
   📄 Description: Master modern JavaScript with this complete course...
```

### `get_youtube_transcript`

Extract complete transcripts from YouTube videos using RapidAPI.

**Parameters:**
- `videoId` (required): YouTube video ID or any YouTube URL format
- `language` (optional): Language code for transcript (e.g., "en", "es", "fr", default: "en")

**Sample Output:**
```
YouTube Transcript for Video ID: W6NZfCO5SIk
📊 Total Segments: 245
⏱️ Duration: 1:23:45

--- TRANSCRIPT ---
[0:00] Welcome to this JavaScript tutorial for beginners
[0:05] In this video we're going to learn the fundamentals
[0:12] Let's start with variables and data types
...
```

## 🛠️ Development

### Available Scripts

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run dev` - Watch mode for development (auto-rebuild on changes)
- `pnpm start` - Run the compiled server directly
- `pnpm run test` - Test YouTube transcript functionality
- `pnpm run test-mcp` - Test MCP server functionality
- `pnpm run test-search` - Test YouTube search API functionality
- `pnpm run test-mcp-search` - Test MCP server with search functionality

### Project Structure

```
youtube-tools-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript output
├── docs/                 # Documentation and examples
├── temp/                 # Test files and utilities
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Testing

Test the server functionality:
```bash
# Test YouTube transcript extraction
pnpm run test

# Test YouTube search API
pnpm run test-search

# Test MCP server protocol
pnpm run test-mcp

# Test MCP server with search functionality
pnpm run test-mcp-search

# Manual server test (runs until Ctrl+C)
pnpm start
```

## ⚠️ Error Handling

The server provides clear error messages for common scenarios:

| Error | Cause | Solution |
|-------|-------|----------|
| "Transcript is disabled" | Video creator disabled transcripts | Try a different video |
| "No transcript found" | No transcript in requested language | Try "en" or check available languages |
| "Video unavailable" | Private, deleted, or restricted video | Verify the video is public and accessible |
| "Invalid video ID" | Malformed URL or ID | Check the YouTube URL format |

## 🔧 Troubleshooting

**Server not appearing in Claude Desktop?**
1. Verify the absolute path in your config is correct
2. Ensure the project built successfully (`pnpm run build`)
3. Restart Claude Desktop completely
4. Check Claude's logs: `~/Library/Logs/Claude/mcp*.log`

**Tool calls failing?**
1. Test the server manually: `pnpm start`
2. Verify the video has transcripts available
3. Try with a different video
4. Check the video is public and not region-restricted

## 📦 Dependencies

- **[@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)** - Official MCP SDK for TypeScript
- **[youtube-transcript](https://www.npmjs.com/package/youtube-transcript)** - YouTube transcript extraction library

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using the Model Context Protocol**
