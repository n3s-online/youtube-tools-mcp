#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { YoutubeTranscript } from 'youtube-transcript';

/**
 * YouTube Tools MCP Server
 * 
 * This server provides tools for working with YouTube content,
 * including transcript extraction.
 */

class YouTubeToolsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'youtube-tools-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_youtube_transcript',
            description: 'Extract transcript from a YouTube video',
            inputSchema: {
              type: 'object',
              properties: {
                videoId: {
                  type: 'string',
                  description: 'YouTube video ID or full YouTube URL',
                },
                language: {
                  type: 'string',
                  description: 'Language code for transcript (optional, e.g., "en", "es", "fr")',
                  default: 'en',
                },
              },
              required: ['videoId'],
            },
          },
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'get_youtube_transcript') {
          return await this.getYouTubeTranscript(args);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  private extractVideoId(input: string): string {
    // If it's already a video ID (11 characters), return as is
    if (input.length === 11 && !input.includes('/') && !input.includes('=')) {
      return input;
    }

    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If no pattern matches, assume it's already a video ID
    return input;
  }

  private async getYouTubeTranscript(args: any) {
    const { videoId: rawVideoId, language = 'en' } = args;

    if (!rawVideoId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'videoId parameter is required'
      );
    }

    try {
      const videoId = this.extractVideoId(rawVideoId);
      
      // Fetch transcript with language preference
      const transcriptConfig = language !== 'en' ? { lang: language } : {};
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, transcriptConfig);

      if (!transcript || transcript.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No transcript available for video ID: ${videoId}`,
            },
          ],
        };
      }

      // Format transcript into readable text
      const formattedTranscript = transcript
        .map((entry) => {
          const timestamp = this.formatTimestamp(entry.offset);
          return `[${timestamp}] ${entry.text}`;
        })
        .join('\n');

      const summary = {
        videoId,
        language,
        totalSegments: transcript.length,
        duration: this.formatTimestamp(transcript[transcript.length - 1]?.offset || 0),
      };

      return {
        content: [
          {
            type: 'text',
            text: `YouTube Transcript for Video ID: ${videoId}\n` +
                  `Language: ${language}\n` +
                  `Total Segments: ${summary.totalSegments}\n` +
                  `Duration: ${summary.duration}\n\n` +
                  `--- TRANSCRIPT ---\n${formattedTranscript}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle common YouTube transcript errors
      if (errorMessage.includes('Transcript is disabled')) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Transcript is disabled for video ID: ${this.extractVideoId(rawVideoId)}`
        );
      } else if (errorMessage.includes('No transcript found')) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `No transcript found for video ID: ${this.extractVideoId(rawVideoId)} in language: ${language}`
        );
      } else if (errorMessage.includes('Video unavailable')) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Video unavailable or private: ${this.extractVideoId(rawVideoId)}`
        );
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch transcript: ${errorMessage}`
      );
    }
  }

  private formatTimestamp(offsetMs: number): string {
    const totalSeconds = Math.floor(offsetMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Server is now running and will handle requests via stdio
    console.error('YouTube Tools MCP server running on stdio');
  }
}

// Start the server
const server = new YouTubeToolsServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
