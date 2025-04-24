import {
  deleteFile,
  getFileMetadata,
  getFileUrl,
  listFiles,
  searchFiles,
  uploadFile,
  uploadMultipleFiles,
} from "@/api/controllers/upload.controller";
import { requireAuth, requirePermission } from "@/domains/auth/middleware";
import express from "express";

const router = express.Router();

/**
 * @route POST /api/upload/file
 * @desc Upload a single file
 * @access Private
 */
router.post(
  "/file",
  requireAuth(),
  requirePermission("canViewProperties"),
  uploadFile
);

/**
 * @route POST /api/upload/files
 * @desc Upload multiple files
 * @access Private
 */
router.post("/files", requireAuth(), requirePermission(), uploadMultipleFiles);

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

/**
 * @route GET /api/upload/list/:directoryPath
 * @desc List files in a directory
 * @access Private
 */
router.get("/list/:directoryPath(*)", requireAuth(), listFiles);

/**
 * @route GET /api/upload/search
 * @desc Search for files
 * @access Private
 */
router.get("/search", requireAuth(), searchFiles);

export const uploadRoutes = router;
