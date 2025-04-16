// src/services/features/documents.service.ts
import { db } from "@/db";
import { documents } from "@/db/schema";
import { storageService } from "@/services/system/storage.service";
import { and, eq } from "drizzle-orm";

export class DocumentsService {
  /**
   * Upload and store a document
   */
  async uploadDocument(data: {
    organizationId: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    fileBuffer: Buffer;
    uploadedBy: string;
    description?: string;
    relatedPropertyId?: string;
    relatedUnitId?: string;
    relatedLeaseId?: string;
    relatedTenantId?: string;
    relatedInspectionId?: string;
  }) {
    // Generate a unique storage path
    const storagePath = `organizations/${data.organizationId}/documents/${Date.now()}_${data.fileName.replace(/\s+/g, "_")}`;

    // Upload file to storage
    const url = await storageService.uploadFile(
      storagePath,
      data.fileBuffer,
      data.mimeType
    );

    // Create document record in database
    const result = await db
      .insert(documents)
      .values({
        organizationId: data.organizationId,
        fileName: data.fileName,
        fileType: data.fileType as any,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        storageProvider: "s3", // Or your configured provider
        storagePath,
        url,
        description: data.description,
        uploadedBy: data.uploadedBy,
        relatedPropertyId: data.relatedPropertyId,
        relatedUnitId: data.relatedUnitId,
        relatedLeaseId: data.relatedLeaseId,
        relatedTenantId: data.relatedTenantId,
        relatedInspectionId: data.relatedInspectionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string) {
    // Get document to get storage path
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Delete from storage service
    await storageService.deleteFile(document.storagePath);

    // Delete from database
    await db.delete(documents).where(eq(documents.id, id));

    return { success: true };
  }

  /**
   * Get documents by entity
   */
  async getDocumentsByEntity(
    organizationId: string,
    entityType: "property" | "unit" | "lease" | "tenant" | "inspection",
    entityId: string
  ) {
    // Build where clause based on entity type
    let whereClause;

    switch (entityType) {
      case "property":
        whereClause = and(
          eq(documents.organizationId, organizationId),
          eq(documents.relatedPropertyId, entityId)
        );
        break;
      case "unit":
        whereClause = and(
          eq(documents.organizationId, organizationId),
          eq(documents.relatedUnitId, entityId)
        );
        break;
      case "lease":
        whereClause = and(
          eq(documents.organizationId, organizationId),
          eq(documents.relatedLeaseId, entityId)
        );
        break;
      case "tenant":
        whereClause = and(
          eq(documents.organizationId, organizationId),
          eq(documents.relatedTenantId, entityId)
        );
        break;
      case "inspection":
        whereClause = and(
          eq(documents.organizationId, organizationId),
          eq(documents.relatedInspectionId, entityId)
        );
        break;
      default:
        throw new Error("Invalid entity type");
    }

    // Query documents
    return db.query.documents.findMany({
      where: whereClause,
      with: {
        uploader: true,
      },
    });
  }
}

export const documentsService = new DocumentsService();
