import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { STORAGE_CONFIG } from "@shared/constants/environment";
import fs from "fs";
import path from "path";

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

class StorageService {
  /**
   * Upload file to appropriate storage provider
   */
  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    switch (STORAGE_CONFIG.STORAGE_TYPE) {
      case "s3":
        return this.uploadToS3(filePath, fileBuffer, contentType);
      case "local":
      default:
        return this.uploadToLocalStorage(filePath, fileBuffer);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    switch (STORAGE_CONFIG.STORAGE_TYPE) {
      case "s3":
        return this.deleteFromS3(filePath);
      case "local":
      default:
        return this.deleteFromLocalStorage(filePath);
    }
  }

  /**
   * Get URL for accessing file
   */
  async getFileUrl(filePath: string): Promise<string> {
    switch (STORAGE_CONFIG.STORAGE_TYPE) {
      case "s3":
        return this.getS3Url(filePath);
      case "local":
      default:
        return this.getLocalUrl(filePath);
    }
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Generate pre-signed URL for temporary access
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
  private async getS3Url(filePath: string): Promise<string> {
    if (!s3Client || !bucketName) {
      throw new Error("S3 client or bucket name not configured");
    }

    const params = {
      Bucket: bucketName,
      Key: filePath,
    };

    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return url;
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
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, fileBuffer);

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
      fs.unlinkSync(fullPath);
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
