import { createClient, Client } from "@libsql/client";
import { join } from "path";

/**
 * Database service for managing video summaries
 * Uses libsql for local database storage
 */
export class DatabaseService {
  private client: Client;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Default to local database file in project root
    this.dbPath = dbPath || join(process.cwd(), "video_summaries.db");
    
    this.client = createClient({
      url: `file:${this.dbPath}`,
    });
  }

  /**
   * Initialize the database and create tables if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS video_summaries (
          video_id TEXT PRIMARY KEY,
          summary TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create an index on video_id for faster lookups
      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_video_id ON video_summaries(video_id)
      `);

      console.error(`Database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * Store or update a video summary
   * @param videoId - YouTube video ID
   * @param summary - Video summary text
   */
  async storeVideoSummary(videoId: string, summary: string): Promise<void> {
    if (!videoId || !summary) {
      throw new Error("Both videoId and summary are required");
    }

    try {
      // Use INSERT OR REPLACE to handle both new entries and updates
      await this.client.execute({
        sql: `
          INSERT OR REPLACE INTO video_summaries (video_id, summary, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `,
        args: [videoId, summary],
      });

      console.error(`Stored summary for video: ${videoId}`);
    } catch (error) {
      console.error(`Failed to store summary for video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch an existing video summary
   * @param videoId - YouTube video ID
   * @returns The summary string or null if not found
   */
  async fetchExistingVideoSummary(videoId: string): Promise<string | null> {
    if (!videoId) {
      throw new Error("videoId is required");
    }

    try {
      const result = await this.client.execute({
        sql: "SELECT summary FROM video_summaries WHERE video_id = ?",
        args: [videoId],
      });

      if (result.rows.length === 0) {
        return null;
      }

      const summary = result.rows[0].summary as string;
      console.error(`Retrieved summary for video: ${videoId}`);
      return summary;
    } catch (error) {
      console.error(`Failed to fetch summary for video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Get all stored video summaries (for debugging/admin purposes)
   */
  async getAllVideoSummaries(): Promise<Array<{ videoId: string; summary: string; createdAt: string; updatedAt: string }>> {
    try {
      const result = await this.client.execute(
        "SELECT video_id, summary, created_at, updated_at FROM video_summaries ORDER BY updated_at DESC"
      );

      return result.rows.map((row) => ({
        videoId: row.video_id as string,
        summary: row.summary as string,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }));
    } catch (error) {
      console.error("Failed to fetch all video summaries:", error);
      throw error;
    }
  }

  /**
   * Delete a video summary
   * @param videoId - YouTube video ID
   */
  async deleteVideoSummary(videoId: string): Promise<boolean> {
    if (!videoId) {
      throw new Error("videoId is required");
    }

    try {
      const result = await this.client.execute({
        sql: "DELETE FROM video_summaries WHERE video_id = ?",
        args: [videoId],
      });

      const deleted = result.rowsAffected > 0;
      if (deleted) {
        console.error(`Deleted summary for video: ${videoId}`);
      }
      return deleted;
    } catch (error) {
      console.error(`Failed to delete summary for video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      console.error("Database connection closed");
    } catch (error) {
      console.error("Failed to close database connection:", error);
    }
  }
}
