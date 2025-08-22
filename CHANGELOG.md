# Changelog

All notable changes to the YouTube Tools MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-22

### Added
- Initial release of YouTube Tools MCP Server
- `get_youtube_transcript` tool for extracting YouTube video transcripts
- Support for multiple YouTube URL formats (full URLs, short URLs, embed URLs, video IDs)
- Multi-language transcript support with optional language parameter
- Comprehensive error handling for common YouTube API scenarios
- TypeScript implementation using official MCP SDK
- Complete documentation and usage examples
- Claude Desktop integration support
- Formatted transcript output with timestamps and metadata

### Features
- **YouTube Transcript Extraction**: Extract complete transcripts with timestamps
- **Flexible Input Processing**: Handles various YouTube URL formats automatically
- **Language Support**: Optional language specification for international content
- **Error Handling**: Clear, actionable error messages for common issues
- **MCP Protocol Compliance**: Built with official MCP SDK for maximum compatibility

### Technical Details
- Built with TypeScript and compiled to JavaScript
- Uses `@modelcontextprotocol/sdk` for MCP protocol implementation
- Uses `youtube-transcript` library for YouTube API interaction
- Supports Node.js 18+
- Package management with pnpm
- Comprehensive test suite and documentation
