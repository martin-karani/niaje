import { STORAGE_CONFIG } from "@/shared/constants/enviroment";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { ValidationError } from "@/shared/errors/validation.error";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { promisify } from "util";

// Initialize S3 client lazily
let s3Client: S3Client | null = null;
const initS3Client = () => {
  if (!s3Client && STORAGE_CONFIG.STORAGE_TYPE === "s3") {
    if (
      !STORAGE_CONFIG.AWS_ACCESS_KEY_ID ||
      !STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY
    ) {
      throw new Error("AWS credentials are required for S3 storage");
    }
    s3Client = new S3Client({
      region: STORAGE_CONFIG.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: STORAGE_CONFIG.AWS_ACCESS_KEY_ID,
        secretAccessKey: STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

const bucketName = STORAGE_CONFIG.AWS_S3_BUCKET;

// Promisify file system operations
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

export class StorageService {
  /**
   * Upload file to appropriate storage provider
   * @param filePath path where the file should be stored
   * @param fileBuffer the file data as buffer
   * @param contentType MIME type of the file
   * @param isPublic whether the file should be publicly accessible
   * @param metadata additional metadata to store with the file
   */
  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
    isPublic: boolean = false,
    metadata: Record<string, string> = {}
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

      // Add timestamp to metadata to track upload time
      const enhancedMetadata = {
        ...metadata,
        uploadTimestamp: new Date().toISOString(),
      };

      // Call appropriate storage provider
      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.uploadToS3(
            sanitizedPath,
            fileBuffer,
            contentType,
            isPublic,
            enhancedMetadata
          );
        case "local":
        default:
          return this.uploadToLocalStorage(
            sanitizedPath,
            fileBuffer,
            enhancedMetadata
          );
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
   * List all files in a specific directory path
   * @param directoryPath The directory path to list files from
   * @param organizationId The organization ID for permission check
   * @returns Array of file information objects
   */
  async listFiles(
    directoryPath: string,
    organizationId: string
  ): Promise<
    Array<{
      name: string;
      path: string;
      size: number;
      lastModified: Date;
      isDirectory: boolean;
    }>
  > {
    try {
      if (!directoryPath || directoryPath.trim() === "") {
        throw new ValidationError("Directory path cannot be empty");
      }

      // Security check: ensure user can only access their organization's files
      if (!directoryPath.startsWith(`organizations/${organizationId}/`)) {
        throw new AuthorizationError("Access denied to this directory path");
      }

      const sanitizedPath = this.sanitizeFilePath(directoryPath);

      switch (STORAGE_CONFIG.STORAGE_TYPE) {
        case "s3":
          return this.listFilesFromS3(sanitizedPath);
        case "local":
        default:
          return this.listFilesFromLocalStorage(sanitizedPath);
      }
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      console.error(`Error listing files from ${directoryPath}:`, error);
      throw new Error(`Failed to list files: ${error.message}`);
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
    metadata?: Record<string, string>;
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
   * List files from S3 bucket
   */
  private async listFilesFromS3(directoryPath: string): Promise<
    Array<{
      name: string;
      path: string;
      size: number;
      lastModified: Date;
      isDirectory: boolean;
    }>
  > {
    const s3 = initS3Client();
    if (!s3 || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    // Ensure directory path ends with a slash for prefix matching
    const prefix = directoryPath.endsWith("/")
      ? directoryPath
      : `${directoryPath}/`;

    const params = {
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: "/",
    };

    try {
      const command = new ListObjectsV2Command(params);
      const result = await s3.send(command);

      const files = [];

      // Process regular files (Contents)
      if (result.Contents) {
        for (const item of result.Contents) {
          // Skip the directory itself (just has the prefix)
          if (item.Key === prefix) continue;

          files.push({
            name: item.Key!.split("/").pop() || "",
            path: item.Key!,
            size: item.Size || 0,
            lastModified: item.LastModified || new Date(),
            isDirectory: false,
          });
        }
      }

      // Process directories (CommonPrefixes)
      if (result.CommonPrefixes) {
        for (const prefixItem of result.CommonPrefixes) {
          const prefixPath = prefixItem.Prefix!;
          const dirName = prefixPath.split("/").filter(Boolean).pop() || "";

          files.push({
            name: dirName,
            path: prefixPath,
            size: 0, // Directories don't have size
            lastModified: new Date(), // S3 doesn't provide last modified for prefixes
            isDirectory: true,
          });
        }
      }

      return files;
    } catch (error) {
      console.error(`Error listing files from S3: ${directoryPath}`, error);
      throw new Error(`S3 listing failed: ${error.message}`);
    }
  }

  /**
   * List files from local storage
   */
  private async listFilesFromLocalStorage(directoryPath: string): Promise<
    Array<{
      name: string;
      path: string;
      size: number;
      lastModified: Date;
      isDirectory: boolean;
    }>
  > {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, directoryPath);

    if (!fs.existsSync(fullPath)) {
      return [];
    }

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        const entryPath = path.join(directoryPath, entry.name);
        const fullEntryPath = path.join(uploadsDir, entryPath);

        if (entry.isDirectory()) {
          files.push({
            name: entry.name,
            path: entryPath,
            size: 0,
            lastModified: new Date(),
            isDirectory: true,
          });
        } else {
          const stats = await stat(fullEntryPath);
          files.push({
            name: entry.name,
            path: entryPath,
            size: stats.size,
            lastModified: stats.mtime,
            isDirectory: false,
          });
        }
      }

      return files;
    } catch (error) {
      console.error(
        `Error listing files from local storage: ${directoryPath}`,
        error
      );
      throw new Error(`Local file listing failed: ${error.message}`);
    }
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
    isPublic: boolean = false,
    metadata: Record<string, string> = {}
  ): Promise<string> {
    const s3 = initS3Client();
    if (!s3 || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    // Set ACL based on public/private setting
    const ACL = isPublic ? "public-read" : "private";

    // Convert metadata to string values (S3 only accepts string metadata)
    const stringMetadata: Record<string, string> = {};
    Object.entries(metadata).forEach(([key, value]) => {
      stringMetadata[key] = String(value);
    });

    const params = {
      Bucket: bucketName,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
      ACL,
      Metadata: stringMetadata,
    };

    try {
      const command = new PutObjectCommand(params);
      const result = await s3.send(command);

      console.log(`Successfully uploaded file to S3: ${filePath}`, {
        etag: result.ETag,
        versionId: result.VersionId,
      });

      // For public files, return direct S3 URL
      if (isPublic) {
        return `https://${bucketName}.s3.${STORAGE_CONFIG.AWS_REGION || "us-east-1"}.amazonaws.com/${filePath}`;
      }

      // For private files, return pre-signed URL
      return this.getS3Url(filePath);
    } catch (error) {
      console.error(`Error uploading to S3: ${filePath}`, error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(filePath: string): Promise<void> {
    const s3 = initS3Client();
    if (!s3 || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    try {
      const command = new DeleteObjectCommand(params);
      await s3.send(command);
      console.log(`Successfully deleted file from S3: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting from S3: ${filePath}`, error);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Get pre-signed URL for S3 file
   */
  private async getS3Url(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const s3 = initS3Client();
    if (!s3 || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    try {
      const command = new GetObjectCommand(params);
      const url = await getSignedUrl(s3, command, { expiresIn });
      return url;
    } catch (error) {
      console.error(`Error generating pre-signed URL: ${filePath}`, error);
      throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   */
  private async fileExistsInS3(filePath: string): Promise<boolean> {
    const s3 = initS3Client();
    if (!s3 || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    try {
      const params = {
        Bucket: bucketName,
        Key: filePath,
      };

      const command = new HeadObjectCommand(params);
      await s3.send(command);
      return true;
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      console.error(`Error checking if file exists in S3: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get file content from S3
   */
  private async getFileFromS3(filePath: string): Promise<Buffer> {
    const s3 = initS3Client();
    if (!s3 || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    try {
      const command = new GetObjectCommand(params);
      const response = await s3.send(command);

      // Convert stream to buffer
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        response.Body.on("data", (chunk) => chunks.push(chunk));
        response.Body.on("end", () => resolve(Buffer.concat(chunks)));
        response.Body.on("error", reject);
      });
    } catch (error) {
      console.error(`Error getting file from S3: ${filePath}`, error);
      throw new Error(`S3 file retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata from S3
   */
  private async getFileMetadataFromS3(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    contentType?: string;
    metadata?: Record<string, string>;
  }> {
    const s3 = initS3Client();
    if (!s3 || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    try {
      const command = new HeadObjectCommand(params);
      const response = await s3.send(command);

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error(`Error getting metadata from S3: ${filePath}`, error);
      throw new Error(`S3 metadata retrieval failed: ${error.message}`);
    }
  }

  /**
   * Upload file to local file system
   */
  private async uploadToLocalStorage(
    filePath: string,
    fileBuffer: Buffer,
    metadata: Record<string, string> = {}
  ): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);
    const dirPath = path.dirname(fullPath);
    const metadataPath = `${fullPath}.metadata.json`;

    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      // Write file
      await writeFile(fullPath, fileBuffer);

      // Store metadata in a separate file if provided
      if (Object.keys(metadata).length > 0) {
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      console.log(`Successfully uploaded file to local storage: ${filePath}`);

      // Return local URL
      return this.getLocalUrl(filePath);
    } catch (error) {
      console.error(`Error uploading to local storage: ${filePath}`, error);
      throw new Error(`Local file upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from local file system
   */
  private async deleteFromLocalStorage(filePath: string): Promise<void> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);
    const metadataPath = `${fullPath}.metadata.json`;

    try {
      if (fs.existsSync(fullPath)) {
        await unlink(fullPath);
        console.log(
          `Successfully deleted file from local storage: ${filePath}`
        );

        // Delete metadata file if it exists
        if (fs.existsSync(metadataPath)) {
          await unlink(metadataPath);
        }
      } else {
        console.warn(`File not found in local storage: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error deleting from local storage: ${filePath}`, error);
      throw new Error(`Local file deletion failed: ${error.message}`);
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

    try {
      return await readFile(fullPath);
    } catch (error) {
      console.error(
        `Error reading file from local storage: ${filePath}`,
        error
      );
      throw new Error(`Local file read failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata from local storage
   */
  private async getFileMetadataFromLocalStorage(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    contentType?: string;
    metadata?: Record<string, string>;
  }> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadsDir, filePath);
    const metadataPath = `${fullPath}.metadata.json`;

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
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

      // Load metadata if it exists
      let metadata: Record<string, string> | undefined = undefined;
      if (fs.existsSync(metadataPath)) {
        const metadataJson = await readFile(metadataPath, "utf8");
        metadata = JSON.parse(metadataJson);
      }

      return {
        size: stats.size,
        lastModified: stats.mtime,
        contentType: contentTypeMap[extname] || "application/octet-stream",
        metadata,
      };
    } catch (error) {
      console.error(
        `Error getting file metadata from local storage: ${filePath}`,
        error
      );
      throw new Error(`Local file metadata retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get URL for local file
   */
  private getLocalUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }
}

export const storageService = new StorageService();
