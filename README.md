# YouTube Tools MCP Server

A powerful Model Context Protocol (MCP) server that enables AI assistants to extract and work with YouTube video transcripts. Built with TypeScript and designed for seamless integration with Claude Desktop and other MCP-compatible clients.

## 🎯 What is this?

This MCP server bridges the gap between AI assistants and YouTube content by providing transcript extraction capabilities. It allows you to:

- Extract full transcripts from any YouTube video (when available)
- Get timestamped transcript segments for precise referencing
- Support multiple languages for international content
- Handle various YouTube URL formats automatically

Perfect for content analysis, research, accessibility, and AI-powered video content workflows.

## ✨ Features

- **🎬 YouTube Transcript Extraction**: Get complete transcripts from YouTube videos with precise timestamps
- **🔗 Flexible Input Formats**: Supports video IDs, full URLs, short URLs, and embed URLs
- **🌍 Multi-Language Support**: Extract transcripts in different languages when available
- **⚡ Smart Error Handling**: Comprehensive error handling with clear, actionable messages
- **🛠️ MCP Protocol Compliant**: Built with the official MCP SDK for maximum compatibility
- **📝 Formatted Output**: Clean, readable transcript format with metadata and timestamps

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Claude Desktop (for usage)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd youtube-tools-mcp
   pnpm install
   ```

2. **Build the project:**
   ```bash
   pnpm run build
   ```

3. **Configure Claude Desktop:**

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

4. **Restart Claude Desktop** completely.

5. **Test it out!** Try asking Claude:
   ```
   "Get the transcript for this YouTube video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   ```

## 📖 Usage Examples

Once configured with Claude Desktop, you can use natural language to interact with YouTube videos:

### Basic Examples

**Extract any video transcript:**
```
"Get the transcript for this YouTube video: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Use just the video ID:**
```
"Extract the transcript from YouTube video ID: dQw4w9WgXcQ"
```

**Request specific language:**
```
"Get the Spanish transcript for this video: https://www.youtube.com/watch?v=example"
```

**Works with different URL formats:**
- Full URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Short URL: `https://youtu.be/dQw4w9WgXcQ`
- Embed URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Video ID: `dQw4w9WgXcQ`

## 🔧 Available Tools

### `get_youtube_transcript`

The main tool for extracting YouTube video transcripts.

**Parameters:**
- `videoId` (required): YouTube video ID or any YouTube URL format
- `language` (optional): Language code (e.g., "en", "es", "fr", "de") - defaults to "en"

**Sample Output:**
```
YouTube Transcript for Video ID: dQw4w9WgXcQ
Language: en
Total Segments: 45
Duration: 3:33

--- TRANSCRIPT ---
[0:00] We're no strangers to love
[0:07] You know the rules and so do I
[0:15] A full commitment's what I'm thinking of
[0:22] You wouldn't get this from any other guy
...
```

## 🛠️ Development

### Available Scripts

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run dev` - Watch mode for development (auto-rebuild on changes)
- `pnpm start` - Run the compiled server directly
- `pnpm run test` - Test YouTube transcript functionality
- `pnpm run test-mcp` - Test MCP server functionality

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

# Test MCP server protocol
pnpm run test-mcp

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
