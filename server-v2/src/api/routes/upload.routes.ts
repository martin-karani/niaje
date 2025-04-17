import {
  deleteFile,
  uploadFile,
  uploadMultipleFiles,
} from "@/controllers/upload.controller";
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

export const uploadRoutes = router;
