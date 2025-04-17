import { storageService } from "@/infrastructure/storage/storage.service";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { ValidationError } from "@/shared/errors/validation.error";
import { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, callback) => {
    // Allow common document and image file types
    const allowedTypes = [
      // Images
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      // Documents
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".csv",
      ".txt",
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      return callback(null, true);
    }
    callback(new Error("Only image and document files are allowed"));
  },
});

/**
 * Handle single file upload
 */
export const uploadFile = [
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ValidationError("No file uploaded");
      }

      if (!req.user || !req.activeOrganization) {
        throw new AuthorizationError("Authentication required");
      }

      const organizationId = req.activeOrganization.id;
      const userId = req.user.id;

      // Generate unique filename and path
      const fileExtension = path.extname(req.file.originalname);
      const uniqueId = uuidv4();
      const fileName = `${uniqueId}${fileExtension}`;

      // Determine storage path based on entity type (if provided)
      const entityType = req.body.entityType || "general";
      const entityId = req.body.entityId || "misc";

      const filePath = `organizations/${organizationId}/${entityType}/${entityId}/${fileName}`;

      // Upload to storage
      const fileUrl = await storageService.uploadFile(
        filePath,
        req.file.buffer,
        req.file.mimetype
      );

      // Return file information
      res.status(200).json({
        success: true,
        file: {
          originalName: req.file.originalname,
          fileName: fileName,
          size: req.file.size,
          mimeType: req.file.mimetype,
          url: fileUrl,
          path: filePath,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

/**
 * Handle multiple file uploads
 */
export const uploadMultipleFiles = [
  upload.array("files", 10), // Max 10 files
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new ValidationError("No files uploaded");
      }

      if (!req.user || !req.activeOrganization) {
        throw new AuthorizationError("Authentication required");
      }

      const organizationId = req.activeOrganization.id;
      const userId = req.user.id;

      // Determine storage path based on entity type (if provided)
      const entityType = req.body.entityType || "general";
      const entityId = req.body.entityId || "misc";

      // Process each file
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          // Generate unique filename and path
          const fileExtension = path.extname(file.originalname);
          const uniqueId = uuidv4();
          const fileName = `${uniqueId}${fileExtension}`;

          const filePath = `organizations/${organizationId}/${entityType}/${entityId}/${fileName}`;

          // Upload to storage
          const fileUrl = await storageService.uploadFile(
            filePath,
            file.buffer,
            file.mimetype
          );

          return {
            originalName: file.originalname,
            fileName: fileName,
            size: file.size,
            mimeType: file.mimetype,
            url: fileUrl,
            path: filePath,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          };
        })
      );

      // Return file information
      res.status(200).json({
        success: true,
        files: uploadedFiles,
      });
    } catch (error) {
      next(error);
    }
  },
];

/**
 * Delete a file
 */
export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filePath } = req.params;

    if (!req.user || !req.activeOrganization) {
      throw new AuthorizationError("Authentication required");
    }

    const organizationId = req.activeOrganization.id;

    // Security check: ensure file belongs to the organization
    if (!filePath.startsWith(`organizations/${organizationId}/`)) {
      throw new AuthorizationError(
        "You don't have permission to delete this file"
      );
    }

    await storageService.deleteFile(filePath);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
