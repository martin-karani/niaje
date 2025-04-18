import { documentEntity } from "@/domains/documents/entities";
import { db } from "@/infrastructure/database";
import { storageService } from "@/infrastructure/storage/storage.service";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { ValidationError } from "@/shared/errors/validation.error";
import { and, desc, eq } from "drizzle-orm";

export class DocumentsService {
  /**
   * Create a document record
   */
  async createDocument(data: {
    organizationId: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    storageProvider: string;
    storagePath: string;
    url: string;
    description?: string;
    uploadedBy: string;
    relatedPropertyId?: string;
    relatedUnitId?: string;
    relatedLeaseId?: string;
    relatedTenantId?: string;
    relatedInspectionId?: string;
  }) {
    // Validate required fields
    if (!data.fileName || !data.mimeType) {
      throw new ValidationError("Filename and MIME type are required");
    }

    // Create the document record
    const result = await db
      .insert(documentEntity)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string, organizationId: string) {
    const document = await db.query.documentEntity.findFirst({
      where: eq(documentEntity.id, id),
    });

    if (!document) {
      throw new ValidationError("Document not found");
    }

    // Ensure document belongs to the organization
    if (document.organizationId !== organizationId) {
      throw new AuthorizationError("You don't have access to this document");
    }

    return document;
  }

  /**
   * Get documents by organization
   */
  async getDocumentsByOrganization(organizationId: string) {
    return db.query.documentEntity.findMany({
      where: eq(documentEntity.organizationId, organizationId),
      orderBy: [desc(documentEntity.createdAt)],
    });
  }

  /**
   * Get documents by property
   */
  async getDocumentsByProperty(propertyId: string, organizationId: string) {
    return db.query.documentEntity.findMany({
      where: and(
        eq(documentEntity.relatedPropertyId, propertyId),
        eq(documentEntity.organizationId, organizationId)
      ),
      orderBy: [desc(documentEntity.createdAt)],
    });
  }

  /**
   * Get documents by lease
   */
  async getDocumentsByLease(leaseId: string, organizationId: string) {
    return db.query.documentEntity.findMany({
      where: and(
        eq(documentEntity.relatedLeaseId, leaseId),
        eq(documentEntity.organizationId, organizationId)
      ),
      orderBy: [desc(documentEntity.createdAt)],
    });
  }

  /**
   * Get documents by tenant
   */
  async getDocumentsByTenant(tenantId: string, organizationId: string) {
    return db.query.documentEntity.findMany({
      where: and(
        eq(documentEntity.relatedTenantId, tenantId),
        eq(documentEntity.organizationId, organizationId)
      ),
      orderBy: [desc(documentEntity.createdAt)],
    });
  }

  /**
   * Get documents by entity type and ID
   */
  async getDocumentsByEntity(
    entityType: string,
    entityId: string,
    organizationId: string
  ) {
    let whereClause;

    switch (entityType) {
      case "property":
        whereClause = eq(documentEntity.relatedPropertyId, entityId);
        break;
      case "unit":
        whereClause = eq(documentEntity.relatedUnitId, entityId);
        break;
      case "lease":
        whereClause = eq(documentEntity.relatedLeaseId, entityId);
        break;
      case "tenant":
        whereClause = eq(documentEntity.relatedTenantId, entityId);
        break;
      case "inspection":
        whereClause = eq(documentEntity.relatedInspectionId, entityId);
        break;
      default:
        throw new ValidationError("Invalid entity type");
    }

    return db.query.documentEntity.findMany({
      where: and(
        whereClause,
        eq(documentEntity.organizationId, organizationId)
      ),
      orderBy: [desc(documentEntity.createdAt)],
    });
  }

  /**
   * Update document details
   */
  async updateDocument(
    id: string,
    organizationId: string,
    data: {
      description?: string;
      // Other fields that can be updated...
    }
  ) {
    // First get the document to verify ownership
    const document = await this.getDocumentById(id, organizationId);

    // Update the document
    const result = await db
      .update(documentEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(documentEntity.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string, organizationId: string) {
    // First get the document to verify ownership
    const document = await this.getDocumentById(id, organizationId);

    // Delete the file from storage
    try {
      await storageService.deleteFile(document.storagePath);
    } catch (error) {
      console.error(`Error deleting file from storage: ${error.message}`);
      // Continue with deletion of database record even if storage deletion fails
    }

    // Delete the document record
    await db.delete(documentEntity).where(eq(documentEntity.id, id));

    return true;
  }

  /**
   * Upload document file and create document record
   * This would typically be called from the file upload controller
   */
  async uploadDocument(
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    data: {
      organizationId: string;
      uploadedBy: string;
      fileType: string;
      description?: string;
      relatedPropertyId?: string;
      relatedUnitId?: string;
      relatedLeaseId?: string;
      relatedTenantId?: string;
      relatedInspectionId?: string;
      isPublic?: boolean;
    }
  ) {
    // Determine storage path based on entity type and ID
    let storagePath = `organizations/${data.organizationId}/documents/`;

    if (data.relatedPropertyId) {
      storagePath += `properties/${data.relatedPropertyId}/`;
    } else if (data.relatedUnitId) {
      storagePath += `units/${data.relatedUnitId}/`;
    } else if (data.relatedLeaseId) {
      storagePath += `leases/${data.relatedLeaseId}/`;
    } else if (data.relatedTenantId) {
      storagePath += `tenants/${data.relatedTenantId}/`;
    } else if (data.relatedInspectionId) {
      storagePath += `inspections/${data.relatedInspectionId}/`;
    } else {
      storagePath += `general/`;
    }

    // Add filename to path
    storagePath += file.originalname;

    // Upload file to storage
    const url = await storageService.uploadFile(
      storagePath,
      file.buffer,
      file.mimetype,
      data.isPublic || false,
      {
        uploadedBy: data.uploadedBy,
        organizationId: data.organizationId,
        description: data.description || "",
      }
    );

    // Create document record
    return this.createDocument({
      organizationId: data.organizationId,
      fileName: file.originalname,
      fileType: data.fileType,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageProvider: "local", // Or could be 's3', 'azure', etc. based on config
      storagePath: storagePath,
      url: url,
      description: data.description,
      uploadedBy: data.uploadedBy,
      relatedPropertyId: data.relatedPropertyId,
      relatedUnitId: data.relatedUnitId,
      relatedLeaseId: data.relatedLeaseId,
      relatedTenantId: data.relatedTenantId,
      relatedInspectionId: data.relatedInspectionId,
    });
  }
}

export const documentsService = new DocumentsService();
