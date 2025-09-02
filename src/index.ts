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
import { DatabaseService } from "./database.js";

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
  private database: DatabaseService;

  constructor() {
    this.database = new DatabaseService(process.env.DATABASE_PATH);
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
      await this.database.close();
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
          {
            name: "search_youtube",
            description:
              "Search for YouTube videos using the YouTube Data API v3",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for YouTube videos",
                },
                maxResults: {
                  type: "number",
                  description:
                    "Maximum number of results to return (1-50, default: 10)",
                  default: 10,
                  minimum: 1,
                  maximum: 50,
                },
                order: {
                  type: "string",
                  description:
                    "Order of results (relevance, date, rating, viewCount, title)",
                  enum: ["relevance", "date", "rating", "viewCount", "title"],
                  default: "relevance",
                },
                publishedAfter: {
                  type: "string",
                  description:
                    "Return videos published after this date (RFC 3339 format, e.g., '2023-01-01T00:00:00Z')",
                },
                publishedBefore: {
                  type: "string",
                  description:
                    "Return videos published before this date (RFC 3339 format, e.g., '2024-01-01T00:00:00Z')",
                },
                videoDuration: {
                  type: "string",
                  description: "Filter by video duration",
                  enum: ["any", "short", "medium", "long"],
                  default: "any",
                },
                videoDefinition: {
                  type: "string",
                  description: "Filter by video definition",
                  enum: ["any", "high", "standard"],
                  default: "any",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "fetchExistingVideoSummary",
            description: "Fetch an existing video summary from the database",
            inputSchema: {
              type: "object",
              properties: {
                videoId: {
                  type: "string",
                  description: "YouTube video ID",
                },
              },
              required: ["videoId"],
            },
          },
          {
            name: "storeVideoSummary",
            description: "Store or update a video summary in the database",
            inputSchema: {
              type: "object",
              properties: {
                videoId: {
                  type: "string",
                  description: "YouTube video ID",
                },
                summary: {
                  type: "string",
                  description: "Video summary text to store",
                },
              },
              required: ["videoId", "summary"],
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
        } else if (name === "search_youtube") {
          return await this.searchYouTube(args);
        } else if (name === "fetchExistingVideoSummary") {
          return await this.fetchExistingVideoSummary(args);
        } else if (name === "storeVideoSummary") {
          return await this.storeVideoSummary(args);
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

  private async searchYouTube(args: any) {
    const {
      query,
      maxResults = 10,
      order = "relevance",
      publishedAfter,
      publishedBefore,
      videoDuration = "any",
      videoDefinition = "any",
    } = args;

    if (!query) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "query parameter is required"
      );
    }

    // Check for YouTube API key
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      throw new McpError(
        ErrorCode.InternalError,
        "YouTube API key not found. Please set YOUTUBE_API_KEY in your .env file. Get your key from: https://console.cloud.google.com/"
      );
    }

    try {
      // Build search parameters
      const searchParams = new URLSearchParams({
        part: "snippet",
        type: "video",
        q: query,
        maxResults: maxResults.toString(),
        order: order,
        key: youtubeApiKey,
      });

      // Add optional parameters
      if (publishedAfter) {
        searchParams.append("publishedAfter", publishedAfter);
      }
      if (publishedBefore) {
        searchParams.append("publishedBefore", publishedBefore);
      }
      if (videoDuration !== "any") {
        searchParams.append("videoDuration", videoDuration);
      }
      if (videoDefinition !== "any") {
        searchParams.append("videoDefinition", videoDefinition);
      }

      // Make API request to YouTube Data API v3
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`
      );

      const searchResults = response.data;

      if (!searchResults.items || searchResults.items.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No YouTube videos found for query: "${query}"`,
            },
          ],
        };
      }

      // Format the results
      const formattedResults = searchResults.items
        .map((item: any, index: number) => {
          const snippet = item.snippet;
          const videoId = item.id.videoId;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

          return [
            `${index + 1}. **${snippet.title}**`,
            `   📺 Channel: ${snippet.channelTitle}`,
            `   📅 Published: ${new Date(
              snippet.publishedAt
            ).toLocaleDateString()}`,
            `   🔗 URL: ${videoUrl}`,
            `   📝 Video ID: ${videoId}`,
            `   📄 Description: ${snippet.description.substring(0, 200)}${
              snippet.description.length > 200 ? "..." : ""
            }`,
            "",
          ].join("\n");
        })
        .join("\n");

      const summary = {
        query,
        totalResults:
          searchResults.pageInfo?.totalResults || searchResults.items.length,
        resultsReturned: searchResults.items.length,
        order,
      };

      return {
        content: [
          {
            type: "text",
            text:
              `YouTube Search Results for: "${summary.query}"\n` +
              `📊 Total Results Available: ${summary.totalResults}\n` +
              `📋 Results Returned: ${summary.resultsReturned}\n` +
              `🔄 Ordered by: ${summary.order}\n\n` +
              `--- SEARCH RESULTS ---\n${formattedResults}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific YouTube API errors
      if (errorMessage.includes("403")) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "YouTube API access forbidden. Please check your API key and ensure the YouTube Data API v3 is enabled."
        );
      } else if (errorMessage.includes("400")) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid search parameters. Please check your query and filter options."
        );
      } else if (errorMessage.includes("quotaExceeded")) {
        throw new McpError(
          ErrorCode.InternalError,
          "YouTube API quota exceeded. Please try again later or check your quota limits."
        );
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search YouTube: ${errorMessage}`
      );
    }
  }

  private async fetchExistingVideoSummary(args: any) {
    const { videoId } = args;

    if (!videoId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "videoId parameter is required"
      );
    }

    try {
      const summary = await this.database.fetchExistingVideoSummary(videoId);

      if (summary === null) {
        return {
          content: [
            {
              type: "text",
              text: `No summary found for video ID: ${videoId}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Summary for video ID: ${videoId}\n\n${summary}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch video summary: ${errorMessage}`
      );
    }
  }

  private async storeVideoSummary(args: any) {
    const { videoId, summary } = args;

    if (!videoId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "videoId parameter is required"
      );
    }

    if (!summary) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "summary parameter is required"
      );
    }

    try {
      await this.database.storeVideoSummary(videoId, summary);

      return {
        content: [
          {
            type: "text",
            text: `Successfully stored summary for video ID: ${videoId}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to store video summary: ${errorMessage}`
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
    // Initialize database
    await this.database.initialize();

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
