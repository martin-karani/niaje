import { createId } from "@/infrastructure/database/utils/id-generator";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

interface CronJobLog {
  id: string;
  jobName: string;
  status: "success" | "failed" | "running";
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  details?: any;
  error?: string;
}

/**
 * Cron Job Monitor for tracking scheduled task execution
 */
export class CronMonitor {
  private logsDir: string;
  private currentJobs: Map<string, CronJobLog> = new Map();
  private logRetentionDays: number;

  constructor(options?: { logsDir?: string; logRetentionDays?: number }) {
    this.logsDir = options?.logsDir || path.join(process.cwd(), "logs", "cron");
    this.logRetentionDays = options?.logRetentionDays || 30; // Default to 30 days
    this.initialize();
  }

  /**
   * Initialize the monitor and create logs directory
   */
  private async initialize(): Promise<void> {
    try {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.logsDir)) {
        await mkdir(this.logsDir, { recursive: true });
      }

      console.log(
        `Cron monitor initialized, logs will be stored in: ${this.logsDir}`
      );

      // Clean up old logs
      this.cleanupOldLogs();
    } catch (error) {
      console.error("Failed to initialize cron monitor:", error);
    }
  }

  /**
   * Start tracking a cron job execution
   */
  async startJob(jobName: string): Promise<string> {
    const jobId = createId();
    const now = new Date();

    const jobLog: CronJobLog = {
      id: jobId,
      jobName,
      status: "running",
      startTime: now,
    };

    this.currentJobs.set(jobId, jobLog);

    console.log(`[CronMonitor] Started job: ${jobName} (${jobId})`);

    return jobId;
  }

  /**
   * Finish tracking a cron job execution with success
   */
  async finishJob(jobId: string, details?: any): Promise<void> {
    const job = this.currentJobs.get(jobId);

    if (!job) {
      console.warn(`[CronMonitor] No running job found with ID: ${jobId}`);
      return;
    }

    const now = new Date();
    job.status = "success";
    job.endTime = now;
    job.duration = now.getTime() - job.startTime.getTime();

    if (details) {
      job.details = details;
    }

    console.log(
      `[CronMonitor] Completed job: ${job.jobName} (${jobId}) in ${job.duration}ms`
    );

    await this.saveJobLog(job);
    this.currentJobs.delete(jobId);
  }

  /**
   * Mark a cron job as failed
   */
  async failJob(jobId: string, error: Error | string): Promise<void> {
    const job = this.currentJobs.get(jobId);

    if (!job) {
      console.warn(`[CronMonitor] No running job found with ID: ${jobId}`);
      return;
    }

    const now = new Date();
    job.status = "failed";
    job.endTime = now;
    job.duration = now.getTime() - job.startTime.getTime();
    job.error = error instanceof Error ? error.message : error;

    console.error(
      `[CronMonitor] Failed job: ${job.jobName} (${jobId}) in ${job.duration}ms: ${job.error}`
    );

    await this.saveJobLog(job);
    this.currentJobs.delete(jobId);
  }

  /**
   * Save job log to file
   */
  private async saveJobLog(job: CronJobLog): Promise<void> {
    try {
      const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const logFile = path.join(this.logsDir, `${date}.json`);

      let logs: CronJobLog[] = [];

      // Read existing logs if file exists
      if (fs.existsSync(logFile)) {
        const content = await readFile(logFile, "utf8");
        logs = JSON.parse(content);
      }

      // Add new log
      logs.push(job);

      // Write back to file
      await writeFile(logFile, JSON.stringify(logs, null, 2), "utf8");
    } catch (error) {
      console.error(`[CronMonitor] Failed to save job log:`, error);
    }
  }

  /**
   * Clean up logs older than retention period
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await readdir(this.logsDir);
      const now = new Date();

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        // Extract date from filename (expecting YYYY-MM-DD.json)
        const dateStr = file.split(".")[0];
        const fileDate = new Date(dateStr);

        // Calculate days difference
        const diffDays = Math.ceil(
          (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays > this.logRetentionDays) {
          const filePath = path.join(this.logsDir, file);
          await promisify(fs.unlink)(filePath);
          console.log(`[CronMonitor] Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error("[CronMonitor] Failed to clean up old logs:", error);
    }
  }

  /**
   * Get recent job logs
   */
  async getRecentLogs(days: number = 7): Promise<CronJobLog[]> {
    try {
      const files = await readdir(this.logsDir);
      let allLogs: CronJobLog[] = [];
      const now = new Date();

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        // Extract date from filename (expecting YYYY-MM-DD.json)
        const dateStr = file.split(".")[0];
        const fileDate = new Date(dateStr);

        // Calculate days difference
        const diffDays = Math.ceil(
          (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays <= days) {
          const filePath = path.join(this.logsDir, file);
          const content = await readFile(filePath, "utf8");
          const logs: CronJobLog[] = JSON.parse(content);
          allLogs = [...allLogs, ...logs];
        }
      }

      // Sort by start time (newest first)
      return allLogs.sort((a, b) => {
        return (
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      });
    } catch (error) {
      console.error("[CronMonitor] Failed to get recent logs:", error);
      return [];
    }
  }

  /**
   * Get failure count for a specific job
   */
  async getFailureCount(jobName: string, days: number = 7): Promise<number> {
    const logs = await this.getRecentLogs(days);
    return logs.filter(
      (log) => log.jobName === jobName && log.status === "failed"
    ).length;
  }

  /**
   * Get success rate for a specific job
   */
  async getSuccessRate(jobName: string, days: number = 7): Promise<number> {
    const logs = await this.getRecentLogs(days);
    const jobLogs = logs.filter((log) => log.jobName === jobName);

    if (jobLogs.length === 0) return 0;

    const successCount = jobLogs.filter(
      (log) => log.status === "success"
    ).length;
    return (successCount / jobLogs.length) * 100;
  }
}

// Export singleton instance
export const cronMonitor = new CronMonitor();
