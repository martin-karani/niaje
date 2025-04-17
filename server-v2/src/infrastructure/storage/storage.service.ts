import { STORAGE_CONFIG } from "@/shared/constants/enviroment";
import { ValidationError } from "@/shared/errors/validation.error";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { promisify } from "util";

// Initialize S3 client if AWS credentials are provided
const s3Client =
  STORAGE_CONFIG.STORAGE_TYPE === "s3"
    ? new S3Client({
        region: STORAGE_CONFIG.AWS_REGION,
        credentials: {
          accessKeyId: STORAGE_CONFIG.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY || "",
        },
      })
    : null;

const bucketName = STORAGE_CONFIG.AWS_S3_BUCKET;

// Promisify file system operations
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export class StorageService {
  /**
   * Upload file to appropriate storage provider
   * @param filePath path where the file should be stored
   * @param fileBuffer the file data as buffer
   * @param contentType MIME type of the file
   * @param isPublic whether the file should be publicly accessible
   */
  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
    isPublic: boolean = false
  ): Promise<string> {
    try {
      // Input validation
      if (!filePath || filePath.trim() === "") {
        throw new ValidationError("File path cannot be empty");
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new ValidationError("File buffer cannot be empty");
      }

      // Validate content type
      if (!contentType || contentType.trim() === "") {
        contentType = "application/octet-stream"; // Default content type
      }

      // Ensure file path is sanitized to prevent directory traversal
      const sanitizedPath = this.sanitizeFilePath(filePath);

      // File size check
      const fileSizeInMB = fileBuffer.length / (1024 * 1024);
      const maxSizeMB = 10; // 10MB limit

      if (fileSizeInMB > maxSizeMB) {
        throw new ValidationError(`File size exceeds the ${maxSizeMB}MB limit`);
      }

      // Call appropriate storage provider
      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.uploadToS3(
            sanitizedPath,
            fileBuffer,
            contentType,
            isPublic
          );
        case "local":
        default:
          return this.uploadToLocalStorage(sanitizedPath, fileBuffer);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error uploading file ${filePath}:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (!filePath || filePath.trim() === "") {
        throw new ValidationError("File path cannot be empty");
      }

      // Sanitize file path
      const sanitizedPath = this.sanitizeFilePath(filePath);

      // Check if file exists before attempting to delete
      const exists = await this.fileExists(sanitizedPath);
      if (!exists) {
        console.warn(`File ${sanitizedPath} does not exist, skipping deletion`);
        return;
      }

      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.deleteFromS3(sanitizedPath);
        case "local":
        default:
          return this.deleteFromLocalStorage(sanitizedPath);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error deleting file ${filePath}:`, error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get URL for accessing file
   * @param filePath path to the file
   * @param expiresIn expiration time in seconds for presigned URLs (default: 1 hour)
   */
  async getFileUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      if (!filePath || filePath.trim() === "") {
        throw new ValidationError("File path cannot be empty");
      }

      const sanitizedPath = this.sanitizeFilePath(filePath);

      // Check if file exists before generating URL
      const exists = await this.fileExists(sanitizedPath);
      if (!exists) {
        throw new ValidationError(`File ${sanitizedPath} does not exist`);
      }

      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.getS3Url(sanitizedPath, expiresIn);
        case "local":
        default:
          return this.getLocalUrl(sanitizedPath);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error getting URL for file ${filePath}:`, error);
      throw new Error(`Failed to get file URL: ${error.message}`);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      if (!filePath || filePath.trim() === "") {
        return false;
      }

      const sanitizedPath = this.sanitizeFilePath(filePath);

      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.fileExistsInS3(sanitizedPath);
        case "local":
        default:
          return this.fileExistsInLocalStorage(sanitizedPath);
      }
    } catch (error) {
      console.error(`Error checking if file ${filePath} exists:`, error);
      return false;
    }
  }

  /**
   * Get file content as buffer
   */
  async getFileContent(filePath: string): Promise<Buffer> {
    try {
      if (!filePath || filePath.trim() === "") {
        throw new ValidationError("File path cannot be empty");
      }

      const sanitizedPath = this.sanitizeFilePath(filePath);

      // Check if file exists
      const exists = await this.fileExists(sanitizedPath);
      if (!exists) {
        throw new ValidationError(`File ${sanitizedPath} does not exist`);
      }

      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.getFileFromS3(sanitizedPath);
        case "local":
        default:
          return this.getFileFromLocalStorage(sanitizedPath);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error getting file content for ${filePath}:`, error);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    contentType?: string;
  }> {
    try {
      if (!filePath || filePath.trim() === "") {
        throw new ValidationError("File path cannot be empty");
      }

      const sanitizedPath = this.sanitizeFilePath(filePath);

      // Check if file exists
      const exists = await this.fileExists(sanitizedPath);
      if (!exists) {
        throw new ValidationError(`File ${sanitizedPath} does not exist`);
      }

      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.getFileMetadataFromS3(sanitizedPath);
        case "local":
        default:
          return this.getFileMetadataFromLocalStorage(sanitizedPath);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error getting file metadata for ${filePath}:`, error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  private sanitizeFilePath(filePath: string): string {
    // Remove any parent directory references and normalize slashes
    return filePath
      .replace(/\.\./g, "") // Remove parent directory references
      .replace(/^\//g, "") // Remove leading slashes
      .replace(/\\/g, "/") // Normalize backslashes to forward slashes
      .replace(/\/\//g, "/"); // Replace double slashes
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
    isPublic: boolean = false
  ): Promise<string> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    // Set ACL based on public/private setting
    const ACL = isPublic ? "public-read" : "private";

    const params = {
      Bucket: bucketName,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
      ACL,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // For public files, return direct S3 URL
    if (isPublic) {
      return `https://${bucketName}.s3.${STORAGE_CONFIG.AWS_REGION}.amazonaws.com/${filePath}`;
    }

    // For private files, return pre-signed URL
    return this.getS3Url(filePath);
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(filePath: string): Promise<void> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  }

  /**
   * Get pre-signed URL for S3 file
   */
  private async getS3Url(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
  }

  /**
   * Check if file exists in S3
   */
  private async fileExistsInS3(filePath: string): Promise<boolean> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    try {
      const params = {
        Bucket: bucketName,
        Key: filePath,
      };

      const command = new HeadObjectCommand(params);
      await s3Client.send(command);
      return true;
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file content from S3
   */
  private async getFileFromS3(filePath: string): Promise<Buffer> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    // Convert stream to buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      response.Body.on("data", (chunk) => chunks.push(chunk));
      response.Body.on("end", () => resolve(Buffer.concat(chunks)));
      response.Body.on("error", reject);
    });
  }

  /**
   * Get file metadata from S3
   */
  private async getFileMetadataFromS3(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    contentType?: string;
  }> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    const command = new HeadObjectCommand(params);
    const response = await s3Client.send(command);

    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
    };
  }

  /**
   * Upload file to local file system
   */
  private async uploadToLocalStorage(
    filePath: string,
    fileBuffer: Buffer
  ): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);
    const dirPath = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    // Write file
    await writeFile(fullPath, fileBuffer);

    // Return local URL
    return this.getLocalUrl(filePath);
  }

  /**
   * Delete file from local file system
   */
  private async deleteFromLocalStorage(filePath: string): Promise<void> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);

    if (fs.existsSync(fullPath)) {
      await unlink(fullPath);
    }
  }

  /**
   * Check if file exists in local storage
   */
  private fileExistsInLocalStorage(filePath: string): boolean {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Get file from local storage
   */
  private async getFileFromLocalStorage(filePath: string): Promise<Buffer> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return readFile(fullPath);
  }

  /**
   * Get file metadata from local storage
   */
  private async getFileMetadataFromLocalStorage(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    contentType?: string;
  }> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = await stat(fullPath);
    const extname = path.extname(fullPath).toLowerCase();

    // Basic mapping of common file extensions to content types
    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".csv": "text/csv",
      ".txt": "text/plain",
    };

    return {
      size: stats.size,
      lastModified: stats.mtime,
      contentType: contentTypeMap[extname] || "application/octet-stream",
    };
  }

  /**
   * Get URL for local file
   */
  private getLocalUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }
}

export const storageService = new StorageService();
