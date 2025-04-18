import { communicationEntity } from "@/domains/communications/entities";
import { tenantEntity } from "@/domains/tenants/entities";
import { userEntity } from "@/domains/users/entities";
import { db } from "@/infrastructure/database";
import { emailService } from "@/infrastructure/email/email.service";
import { and, desc, eq, lte } from "drizzle-orm";

export class CommunicationsService {
  /**
   * Create a communication record
   */
  async createCommunication(data: {
    organizationId: string;
    type: string;
    channel: string;
    subject?: string;
    body: string;
    senderUserId?: string;
    recipientUserId?: string;
    recipientTenantId?: string;
    relatedPropertyId?: string;
    relatedLeaseId?: string;
    relatedMaintenanceId?: string;
    scheduledSendAt?: Date;
    sendEmail?: boolean; // Whether to send an actual email
  }) {
    // Validate recipient - at least one type must be provided
    if (!data.recipientUserId && !data.recipientTenantId) {
      throw new Error("A recipient must be specified");
    }

    // Create the communication record
    const result = await db
      .insert(communicationEntity)
      .values({
        organizationId: data.organizationId,
        type: data.type,
        channel: data.channel,
        subject: data.subject,
        body: data.body,
        senderUserId: data.senderUserId,
        recipientUserId: data.recipientUserId,
        recipientTenantId: data.recipientTenantId,
        relatedPropertyId: data.relatedPropertyId,
        relatedLeaseId: data.relatedLeaseId,
        relatedMaintenanceId: data.relatedMaintenanceId,
        scheduledSendAt: data.scheduledSendAt,
        status: data.scheduledSendAt ? "scheduled" : "sent",
        sentAt: data.scheduledSendAt ? undefined : new Date(),
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send email if requested and we have sufficient information
    if (data.sendEmail && data.type === "email") {
      try {
        let recipientEmail: string | undefined;
        let recipientName: string | undefined;

        // Get recipient info from user or tenant
        if (data.recipientUserId) {
          const recipient = await db.query.user.findFirst({
            where: eq(userEntity.id, data.recipientUserId),
          });

          if (recipient) {
            recipientEmail = recipient.email;
            recipientName = recipient.name;
          }
        } else if (data.recipientTenantId) {
          const recipient = await db.query.tenants.findFirst({
            where: eq(tenantEntity.id, data.recipientTenantId),
          });

          if (recipient) {
            recipientEmail = recipient.email;
            recipientName = `${recipient.firstName} ${recipient.lastName}`;
          }
        }

        // Send the email if we have an address
        if (recipientEmail) {
          await emailService.sendEmail({
            to: recipientEmail,
            subject:
              data.subject || "Notification from Property Management System",
            html: data.body,
          });

          // Update communication with delivery info
          await db
            .update(communicationEntity)
            .set({
              status: "delivered",
              deliveredAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(communicationEntity.id, result[0].id));
        }
      } catch (error) {
        console.error("Error sending email:", error);

        // Update communication with failure info
        await db
          .update(communicationEntity)
          .set({
            status: "failed",
            failedReason: `Error sending email: ${error.message}`,
            updatedAt: new Date(),
          })
          .where(eq(communicationEntity.id, result[0].id));
      }
    }

    return result[0];
  }

  /**
   * Mark communication as read
   */
  async markAsRead(id: string) {
    const result = await db
      .update(communicationEntity)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communicationEntity.id, id))
      .returning();

    return result[0];
  }

  /**
   * Get communications for a user
   */
  async getUserCommunications(userId: string, limit = 50) {
    return db.query.communicationEntity.findMany({
      where: eq(communicationEntity.recipientUserId, userId),
      orderBy: [desc(communicationEntity.createdAt)],
      limit,
    });
  }

  /**
   * Get communications for a tenant
   */
  async getTenantCommunications(tenantId: string, limit = 50) {
    return db.query.communicationEntity.findMany({
      where: eq(communicationEntity.recipientTenantId, tenantId),
      orderBy: [desc(communicationEntity.createdAt)],
      limit,
    });
  }

  /**
   * Process scheduled communications
   * This would be called by a scheduled task
   */
  async processScheduledCommunications() {
    const now = new Date();

    // Find communications scheduled to be sent now or in the past
    const scheduledCommunications = await db.query.communicationEntity.findMany(
      {
        where: and(
          eq(communicationEntity.status, "scheduled"),
          lte(communicationEntity.scheduledSendAt, now)
        ),
      }
    );

    console.log(
      `Processing ${scheduledCommunications.length} scheduled communications`
    );

    for (const comm of scheduledCommunications) {
      try {
        // Determine recipient email
        let recipientEmail: string | undefined;
        let recipientName: string | undefined;

        if (comm.recipientUserId) {
          const recipient = await db.query.userEntity.findFirst({
            where: eq(userEntity.id, comm.recipientUserId),
          });

          if (recipient) {
            recipientEmail = recipient.email;
            recipientName = recipient.name;
          }
        } else if (comm.recipientTenantId) {
          const recipient = await db.query.tenants.findFirst({
            where: eq(tenantEntity.id, comm.recipientTenantId),
          });

          if (recipient) {
            recipientEmail = recipient.email;
            recipientName = `${recipient.firstName} ${recipient.lastName}`;
          }
        }

        // Send communications based on type
        if (comm.type === "email" && recipientEmail) {
          await emailService.sendEmail({
            to: recipientEmail,
            subject:
              comm.subject || "Notification from Property Management System",
            html: comm.body,
          });

          // Update as delivered
          await db
            .update(communicationEntity)
            .set({
              status: "delivered",
              sentAt: new Date(),
              deliveredAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(communicationEntity.id, comm.id));
        } else {
          // For other types (SMS, in-app), we would integrate with relevant services
          // For now, just mark as sent
          await db
            .update(communicationEntity)
            .set({
              status: "sent",
              sentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(communicationEntity.id, comm.id));
        }
      } catch (error) {
        console.error(
          `Error processing scheduled communication ${comm.id}:`,
          error
        );

        // Mark as failed
        await db
          .update(communicationEntity)
          .set({
            status: "failed",
            failedReason: `Error: ${error.message}`,
            updatedAt: new Date(),
          })
          .where(eq(communicationEntity.id, comm.id));
      }
    }
  }
}

export const communicationsService = new CommunicationsService();
