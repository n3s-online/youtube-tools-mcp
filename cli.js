#!/usr/bin/env node

/**
 * YouTube Transcript CLI Tool
 * Simple command-line interface to get YouTube video transcripts
 */

import { Command } from "commander";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const program = new Command();

// Helper function to extract video ID from various YouTube URL formats
function extractVideoId(input) {
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

// Helper function to format timestamp
function formatTimestamp(offsetMs) {
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

// Main command
program
  .name("youtube-transcript")
  .description("Extract transcripts from YouTube videos")
  .version("1.0.0")
  .argument("<video>", "YouTube video ID or URL")
  .option("-l, --language <lang>", "Language code (e.g., en, es, fr)", "en")
  .option("-o, --output <file>", "Output file (optional)")
  .option("--no-timestamps", "Hide timestamps in output")
  .option("--json", "Output in JSON format")
  .action(async (video, options) => {
    try {
      console.log("🔍 Extracting transcript...\n");

      const videoId = extractVideoId(video);
      console.log(`📹 Video ID: ${videoId}`);
      console.log(`🌍 Language: ${options.language}`);

      // Check for RapidAPI key
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        console.log("\n❌ RapidAPI key not found.");
        console.log("Please set RAPIDAPI_KEY in your .env file.");
        console.log(
          "Get your key from: https://rapidapi.com/8v2FWW4H6AmKw89/api/youtube-transcripts"
        );
        process.exit(1);
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
            lang: options.language,
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
        transcript = transcriptData.content.map((entry, index) => ({
          text: entry.text,
          offset: entry.offset, // Already in milliseconds
          duration: entry.duration,
        }));
      }

      if (!transcript || transcript.length === 0) {
        console.log("\n❌ No transcript available for this video.");
        console.log("\nThis could be due to:");
        console.log("• Video has captions disabled by the creator");
        console.log("• Video is private, deleted, or region-restricted");
        console.log("• YouTube has changed their internal API");
        console.log("• Network or firewall restrictions");
        console.log(
          "\n💡 Try visiting the video directly on YouTube to check for captions."
        );
        process.exit(1);
      }

      console.log(`✅ Found ${transcript.length} transcript segments\n`);

      let output = "";

      if (options.json) {
        // JSON output
        output = JSON.stringify(
          {
            videoId,
            language: options.language,
            totalSegments: transcript.length,
            duration: formatTimestamp(
              transcript[transcript.length - 1]?.offset || 0
            ),
            transcript: transcript,
          },
          null,
          2
        );
      } else {
        // Text output
        const header =
          `YouTube Transcript for Video ID: ${videoId}\n` +
          `Language: ${options.language}\n` +
          `Total Segments: ${transcript.length}\n` +
          `Duration: ${formatTimestamp(
            transcript[transcript.length - 1]?.offset || 0
          )}\n\n` +
          `--- TRANSCRIPT ---\n`;

        const formattedTranscript = transcript
          .map((entry) => {
            if (options.timestamps) {
              const timestamp = formatTimestamp(entry.offset);
              return `[${timestamp}] ${entry.text}`;
            } else {
              return entry.text;
            }
          })
          .join("\n");

        output = header + formattedTranscript;
      }

      if (options.output) {
        // Write to file
        const fs = await import("fs");
        fs.writeFileSync(options.output, output, "utf8");
        console.log(`📄 Transcript saved to: ${options.output}`);
      } else {
        // Print to console
        console.log(output);
      }
    } catch (error) {
      console.error("\n❌ Error occurred:");
      console.error("📝 Error message:", error.message);

      if (error.response) {
        console.error("📊 Response status:", error.response.status);
        console.error("📊 Response statusText:", error.response.statusText);
        console.error(
          "📊 Response data:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("📊 Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("📡 Request was made but no response received");
        console.error("📝 Request details:", error.request);
      } else {
        console.error("📝 Error setting up request:", error.message);
      }

      console.error("📝 Full error object:", error);

      if (error.response?.status === 401) {
        console.log("\n💡 Authentication error - check your RapidAPI key");
      } else if (error.response?.status === 429) {
        console.log("\n💡 Rate limit exceeded - try again later");
      } else if (error.response?.status === 404) {
        console.log("\n💡 Video not found or transcript not available");
      }

      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
