// src/services/system/storage.service.ts
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.AWS_S3_BUCKET || "property-management-storage";

export class StorageService {
  /**
   * Upload file to storage
   */
  async uploadFile(
    path: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const params = {
      Bucket: bucketName,
      Key: path,
      Body: fileBuffer,
      ContentType: contentType,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Generate pre-signed URL for temporary access
    const presignedUrl = await this.getFileUrl(path);

    return presignedUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(path: string): Promise<void> {
    const params = {
      Bucket: bucketName,
      Key: path,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  }

  /**
   * Get pre-signed URL for file access
   */
  async getFileUrl(path: string): Promise<string> {
    const params = {
      Bucket: bucketName,
      Key: path,
    };

    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return url;
  }

  /**
   * Local file system storage implementation
   * For development or self-hosted installations
   */
  async uploadFileLocal(path: string, fileBuffer: Buffer): Promise<string> {
    const fs = require("fs");
    const dirPath = `./uploads/${path.substring(0, path.lastIndexOf("/"))}`;

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file
    fs.writeFileSync(`./uploads/${path}`, fileBuffer);

    // Return local URL
    return `/uploads/${path}`;
  }
}

export const storageService = new StorageService();
