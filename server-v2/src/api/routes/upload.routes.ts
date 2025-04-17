import {
  deleteFile,
  getFileMetadata,
  getFileUrl,
  uploadFile,
  uploadMultipleFiles,
} from "@/api/controllers/upload.controller";
import { requireAuth } from "@/infrastructure/auth/middleware";
import express from "express";

const router = express.Router();

/**
 * @route POST /api/upload/file
 * @desc Upload a single file
 * @access Private
 */
router.post("/file", requireAuth(), uploadFile);

/**
 * @route POST /api/upload/files
 * @desc Upload multiple files
 * @access Private
 */
router.post("/files", requireAuth(), uploadMultipleFiles);

/**
 * @route DELETE /api/upload/:filePath
 * @desc Delete a file
 * @access Private
 */
router.delete("/:filePath(*)", requireAuth(), deleteFile);

/**
 * @route GET /api/upload/url/:filePath
 * @desc Get a presigned URL for file download
 * @access Private
 */
router.get("/url/:filePath(*)", requireAuth(), getFileUrl);

/**
 * @route GET /api/upload/metadata/:filePath
 * @desc Get file metadata
 * @access Private
 */
router.get("/metadata/:filePath(*)", requireAuth(), getFileMetadata);

export const uploadRoutes = router;
