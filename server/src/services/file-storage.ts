import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadFile(
  filePath: string,
  contentType: string,
  key: string
): Promise<string> {
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET || "property-management-files",
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    ACL: "private",
  });

  await s3Client.send(command);

  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
}
