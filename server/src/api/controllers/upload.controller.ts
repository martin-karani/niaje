import { teamsService } from "@/domains/organizations/services/team.service";
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_, file, callback) => {
    // Allow common document and image file types
    const allowedTypes = [
      // Images
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".svg",
      // Documents
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".csv",
      ".txt",
      // Additional formats
      ".zip",
      ".rar",
      ".ppt",
      ".pptx",
      ".odt",
      ".ods",
      ".odp",
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      return callback(null, true);
    }
    callback(
      new Error(
        "File type not allowed. Please upload a valid document or image file."
      )
    );
  },
});

/**
 * Validate organizational access to file path
 * Ensures that users can only access their organization's files
 */
function validateOrganizationFileAccess(
  req: Request,
  filePath: string
): boolean {
  if (!req.activeOrganization) {
    return false;
  }

  // Check if the file path belongs to the user's organization
  return filePath.startsWith(`organizations/${req.activeOrganization.id}/`);
}

/**
 * Check team-based access to file (if applicable)
 */
async function validateTeamFileAccess(
  req: Request,
  filePath: string,
  entityType?: string,
  entityId?: string
): Promise<boolean> {
  // If user is admin or agent owner, they always have access
  if (req.user?.role === "admin" || req.user?.role === "agent_owner") {
    return true;
  }

  // If no team context, no team-based access check needed
  if (!req.activeTeam) {
    return true;
  }

  // For property/unit related files, check team assignment
  if (entityType === "property" && entityId) {
    return teamsService.isPropertyInTeam(req.activeTeam.id, entityId);
  }

  // For other entity types, we might need additional checks
  // For example, maintenance requests, tenants, etc.

  // Default to allowing access if no specific check is applicable
  return true;
}

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

      // Check team-based access for file upload
      if (entityType !== "general" && entityId !== "misc") {
        const hasAccess = await validateTeamFileAccess(
          req,
          filePath,
          entityType,
          entityId
        );
        if (!hasAccess) {
          throw new AuthorizationError(
            "You don't have permission to upload files to this entity"
          );
        }
      }

      // Determine if file should be public (default to private)
      const isPublic = req.body.isPublic === "true";

      // Create metadata for the file
      const metadata = {
        originalName: req.file.originalname,
        uploadedBy: userId,
        entityType,
        entityId,
        fileSize: req.file.size.toString(),
      };

      // Upload to storage
      const fileUrl = await storageService.uploadFile(
        filePath,
        req.file.buffer,
        req.file.mimetype,
        isPublic,
        metadata
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
          isPublic,
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

      // Check team-based access for file upload
      if (entityType !== "general" && entityId !== "misc") {
        const filePath = `organizations/${organizationId}/${entityType}/${entityId}/`;
        const hasAccess = await validateTeamFileAccess(
          req,
          filePath,
          entityType,
          entityId
        );
        if (!hasAccess) {
          throw new AuthorizationError(
            "You don't have permission to upload files to this entity"
          );
        }
      }

      // Determine if files should be public (default to private)
      const isPublic = req.body.isPublic === "true";

      // Process each file
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          // Generate unique filename and path
          const fileExtension = path.extname(file.originalname);
          const uniqueId = uuidv4();
          const fileName = `${uniqueId}${fileExtension}`;

          const filePath = `organizations/${organizationId}/${entityType}/${entityId}/${fileName}`;

          // Create metadata for the file
          const metadata = {
            originalName: file.originalname,
            uploadedBy: userId,
            entityType,
            entityId,
            fileSize: file.size.toString(),
          };

          // Upload to storage
          const fileUrl = await storageService.uploadFile(
            filePath,
            file.buffer,
            file.mimetype,
            isPublic,
            metadata
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
            isPublic,
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
    if (!validateOrganizationFileAccess(req, filePath)) {
      throw new AuthorizationError(
        "You don't have permission to delete this file"
      );
    }

    // Extract entity type and ID from path for team access check
    const pathParts = filePath.split("/");
    if (pathParts.length >= 4) {
      const entityType = pathParts[2];
      const entityId = pathParts[3];

      const hasAccess = await validateTeamFileAccess(
        req,
        filePath,
        entityType,
        entityId
      );
      if (!hasAccess) {
        throw new AuthorizationError(
          "You don't have team permission to delete this file"
        );
      }
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

/**
 * Get a presigned URL for file download
 */
export const getFileUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filePath } = req.params;
    const expiresIn = req.query.expiresIn
      ? parseInt(req.query.expiresIn as string)
      : 3600; // Default 1 hour

    if (!req.user || !req.activeOrganization) {
      throw new AuthorizationError("Authentication required");
    }

    const organizationId = req.activeOrganization.id;

    // Security check: ensure file belongs to the organization
    if (!validateOrganizationFileAccess(req, filePath)) {
      throw new AuthorizationError(
        "You don't have permission to access this file"
      );
    }

    // Extract entity type and ID from path for team access check
    const pathParts = filePath.split("/");
    if (pathParts.length >= 4) {
      const entityType = pathParts[2];
      const entityId = pathParts[3];

      const hasAccess = await validateTeamFileAccess(
        req,
        filePath,
        entityType,
        entityId
      );
      if (!hasAccess) {
        throw new AuthorizationError(
          "You don't have team permission to access this file"
        );
      }
    }

    // Get presigned URL for the file
    const fileUrl = await storageService.getFileUrl(filePath, expiresIn);

    res.status(200).json({
      success: true,
      url: fileUrl,
      expiresIn,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (
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
    if (!validateOrganizationFileAccess(req, filePath)) {
      throw new AuthorizationError(
        "You don't have permission to access this file"
      );
    }

    // Extract entity type and ID from path for team access check
    const pathParts = filePath.split("/");
    if (pathParts.length >= 4) {
      const entityType = pathParts[2];
      const entityId = pathParts[3];

      const hasAccess = await validateTeamFileAccess(
        req,
        filePath,
        entityType,
        entityId
      );
      if (!hasAccess) {
        throw new AuthorizationError(
          "You don't have team permission to access this file"
        );
      }
    }

    // Get file metadata
    const metadata = await storageService.getFileMetadata(filePath);

    res.status(200).json({
      success: true,
      metadata,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List files in a directory
 */
export const listFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { directoryPath } = req.params;

    if (!req.user || !req.activeOrganization) {
      throw new AuthorizationError("Authentication required");
    }

    const organizationId = req.activeOrganization.id;

    // Ensure the directory path is specified
    if (!directoryPath) {
      throw new ValidationError("Directory path is required");
    }

    // Security check: ensure directory belongs to the organization
    if (!validateOrganizationFileAccess(req, directoryPath)) {
      throw new AuthorizationError(
        "You don't have permission to access this directory"
      );
    }

    // Extract entity type and ID from path for team access check
    const pathParts = directoryPath.split("/");
    if (pathParts.length >= 4) {
      const entityType = pathParts[2];
      const entityId = pathParts[3];

      const hasAccess = await validateTeamFileAccess(
        req,
        directoryPath,
        entityType,
        entityId
      );
      if (!hasAccess) {
        throw new AuthorizationError(
          "You don't have team permission to access this directory"
        );
      }
    }

    // List files in the directory
    const files = await storageService.listFiles(directoryPath, organizationId);

    res.status(200).json({
      success: true,
      directory: directoryPath,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search for files
 */
export const searchFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query, entityType, entityId } = req.query;

    if (!req.user || !req.activeOrganization) {
      throw new AuthorizationError("Authentication required");
    }

    const organizationId = req.activeOrganization.id;

    // Determine the directory path to search in
    let directoryPath = `organizations/${organizationId}`;

    // If entity type and ID are provided, narrow down the search
    if (entityType && entityId) {
      directoryPath = `${directoryPath}/${entityType}/${entityId}`;

      // Check team access for entity
      const hasAccess = await validateTeamFileAccess(
        req,
        directoryPath,
        entityType as string,
        entityId as string
      );

      if (!hasAccess) {
        throw new AuthorizationError(
          "You don't have team permission to search files for this entity"
        );
      }
    }

    // List all files in the directory (recursive)
    const allFiles = await storageService.listFiles(
      directoryPath,
      organizationId
    );

    // Filter results based on query if provided
    let results = allFiles;
    if (query) {
      const searchTerm = (query as string).toLowerCase();
      results = allFiles.filter((file) =>
        file.name.toLowerCase().includes(searchTerm)
      );
    }

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
};
