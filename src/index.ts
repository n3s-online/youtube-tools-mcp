#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables manually to avoid stdout output
try {
  const envPath = join(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf8");
  const envVars = envFile.split("\n").filter((line) => line.includes("="));

  envVars.forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=").trim();
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  });
} catch (error) {
  // .env file not found or not readable, continue without it
}

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
        name: "youtube-tools-mcp",
        version: "1.0.0",
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
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
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
            name: "get_youtube_transcript",
            description: "Extract transcript from a YouTube video",
            inputSchema: {
              type: "object",
              properties: {
                videoId: {
                  type: "string",
                  description: "YouTube video ID or full YouTube URL",
                },
                language: {
                  type: "string",
                  description:
                    'Language code for transcript (optional, e.g., "en", "es", "fr")',
                  default: "en",
                },
              },
              required: ["videoId"],
            },
          },
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === "get_youtube_transcript") {
          return await this.getYouTubeTranscript(args);
        } else {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  private extractVideoId(input: string): string {
    // If it's already a video ID (11 characters), return as is
    if (input.length === 11 && !input.includes("/") && !input.includes("=")) {
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
    const { videoId: rawVideoId, language = "en" } = args;

    if (!rawVideoId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "videoId parameter is required"
      );
    }

    const videoId = this.extractVideoId(rawVideoId);

    try {
      // Check for RapidAPI key
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        throw new McpError(
          ErrorCode.InternalError,
          "RapidAPI key not found. Please set RAPIDAPI_KEY in your .env file. Get your key from: https://rapidapi.com/8v2FWW4H6AmKw89/api/youtube-transcripts"
        );
      }

      // Fetch transcript using RapidAPI
      const response = await axios.get(
        "https://youtube-transcripts.p.rapidapi.com/youtube/transcript",
        {
          params: {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            videoId: videoId,
            chunkSize: 500,
            text: false,
            lang: language,
          },
          headers: {
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": "youtube-transcripts.p.rapidapi.com",
          },
        }
      );

      const transcriptData = response.data;

      // Convert RapidAPI format to our expected format
      let transcript = [];
      if (transcriptData && transcriptData.content) {
        transcript = transcriptData.content.map((entry: any) => ({
          text: entry.text,
          offset: entry.offset, // Already in milliseconds
          duration: entry.duration,
        }));
      }

      if (!transcript || transcript.length === 0) {
        return {
          content: [
            {
              type: "text",
              text:
                `No transcript available for video ID: ${videoId}.\n\n` +
                `This could be due to:\n` +
                `• Video has captions disabled by the creator\n` +
                `• Video is private, deleted, or region-restricted\n` +
                `• YouTube has changed their internal API (common issue with unofficial transcript tools)\n` +
                `• Network or firewall restrictions\n\n` +
                `💡 Alternative options:\n` +
                `• Visit the video directly on YouTube and check for CC (closed captions) button\n` +
                `• Use YouTube's official transcript feature if available\n` +
                `• Try again later as YouTube's internal APIs change frequently`,
            },
          ],
        };
      }

      // Format the transcript
      const formattedTranscript = transcript
        .map((entry: any) => {
          const timestamp = this.formatTimestamp(entry.offset);
          return `[${timestamp}] ${entry.text}`;
        })
        .join("\n");

      const summary = {
        videoId,
        totalSegments: transcript.length,
        duration: this.formatTimestamp(
          transcript[transcript.length - 1]?.offset || 0
        ),
      };

      return {
        content: [
          {
            type: "text",
            text:
              `YouTube Transcript for Video ID: ${summary.videoId}\n` +
              `📊 Total Segments: ${summary.totalSegments}\n` +
              `⏱️ Duration: ${summary.duration}\n\n` +
              `--- TRANSCRIPT ---\n${formattedTranscript}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific errors from the transcript API
      if (
        errorMessage.includes("invalid video ID") ||
        errorMessage.includes("403")
      ) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Video not found or unavailable: ${videoId}`
        );
      } else if (errorMessage.includes("transcript not available")) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `No transcript available for video ID: ${videoId}`
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
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Server is now running and will handle requests via stdio
    console.error("YouTube Tools MCP server running on stdio");
  }
}

// Start the server
const server = new YouTubeToolsServer();
server.run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
