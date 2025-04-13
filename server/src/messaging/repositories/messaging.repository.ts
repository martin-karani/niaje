import { db } from "@/db";
import {
  messageRecipients,
  messages,
  messageTemplates,
  NewMessage,
  NewMessageRecipient,
  NewMessageTemplate,
} from "@/db/schema/messages";
import { MessageFilterDto } from "@/messaging/dto/messaging.dto";
import { MessageWithRecipients, TemplateWithUser } from "@/messaging/types";
import { and, count, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

export class MessagingRepository {
  /**
   * Find all messages with filtering and pagination
   */
  async findAll(filters?: MessageFilterDto): Promise<MessageWithRecipients[]> {
    // Build the conditions array for filtering
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(eq(messages.propertyId, filters.propertyId));
    }

    if (filters?.type) {
      conditions.push(eq(messages.type, filters.type));
    }

    if (filters?.status) {
      conditions.push(eq(messages.status, filters.status));
    }

    // Apply date range filters
    if (filters?.dateFrom) {
      conditions.push(gte(messages.createdAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(messages.createdAt, filters.dateTo));
    }

    // Apply search filter (search in content and subject)
    if (filters?.search) {
      conditions.push(
        or(
          ilike(messages.content, `%${filters.search}%`),
          ilike(messages.subject || "", `%${filters.search}%`)
        )
      );
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Fetch messages
    const messagesData = await db.query.messages.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [sql`created_at desc`],
      limit,
      offset,
    });

    // For each message, get the recipients
    const messagesWithRecipients = await Promise.all(
      messagesData.map(async (message) => {
        const recipients = await db.query.messageRecipients.findMany({
          where: eq(messageRecipients.messageId, message.id),
          with: {
            tenant: {
              columns: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        return {
          ...message,
          recipients,
        };
      })
    );

    return messagesWithRecipients;
  }

  /**
   * Count messages with filters (for pagination)
   */
  async countMessages(
    filters?: Omit<MessageFilterDto, "page" | "limit">
  ): Promise<number> {
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(eq(messages.propertyId, filters.propertyId));
    }

    if (filters?.type) {
      conditions.push(eq(messages.type, filters.type));
    }

    if (filters?.status) {
      conditions.push(eq(messages.status, filters.status));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(messages.createdAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(messages.createdAt, filters.dateTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(messages.content, `%${filters.search}%`),
          ilike(messages.subject || "", `%${filters.search}%`)
        )
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a message by ID with related data
   */
  async findById(id: string): Promise<MessageWithRecipients | null> {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!message) return null;

    // Get recipients for this message
    const recipients = await db.query.messageRecipients.findMany({
      where: eq(messageRecipients.messageId, id),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      ...message,
      recipients,
    };
  }

  /**
   * Create a new message
   */
  async createMessage(messageData: NewMessage): Promise<MessageWithRecipients> {
    const [createdMessage] = await db
      .insert(messages)
      .values(messageData)
      .returning();

    // Return the newly created message with relations
    return this.findById(createdMessage.id) as Promise<MessageWithRecipients>;
  }

  /**
   * Add recipients to a message
   */
  async addRecipients(
    messageId: string,
    recipientData: NewMessageRecipient[]
  ): Promise<void> {
    // Batch insert all recipients
    await db.insert(messageRecipients).values(recipientData);
  }

  /**
   * Update the status of a message recipient
   */
  async updateRecipientStatus(
    recipientId: string,
    deliveryStatus: string,
    errorMessage: string | null,
    deliveredAt: Date | null
  ): Promise<void> {
    await db
      .update(messageRecipients)
      .set({
        deliveryStatus,
        errorMessage,
        deliveredAt,
      })
      .where(eq(messageRecipients.id, recipientId));
  }

  /**
   * Update the status of a message
   */
  async updateMessageStatus(
    messageId: string,
    status: string,
    metadata: any = null
  ): Promise<void> {
    await db
      .update(messages)
      .set({
        status,
        metadata: metadata ? JSON.stringify(metadata) : null,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));
  }

  /**
   * Delete a message and its recipients
   */
  async deleteMessage(id: string): Promise<void> {
    // Delete will cascade to recipients due to FK constraint
    await db.delete(messages).where(eq(messages.id, id));
  }

  /**
   * Find all message templates
   */
  async findAllTemplates(
    userId: string,
    propertyId?: string
  ): Promise<TemplateWithUser[]> {
    const conditions = [
      // Template is created by this user OR is global
      or(
        eq(messageTemplates.createdBy, userId),
        eq(messageTemplates.isGlobal, "true")
      ),
    ];

    // If propertyId is provided, filter by it or templates with null propertyId
    if (propertyId) {
      conditions.push(
        or(
          eq(messageTemplates.propertyId, propertyId),
          sql`${messageTemplates.propertyId} IS NULL`
        )
      );
    }

    return db.query.messageTemplates.findMany({
      where: and(...conditions),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
          },
        },
        property: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [sql`created_at desc`],
    });
  }

  /**
   * Find a template by ID
   */
  async findTemplateById(id: string): Promise<TemplateWithUser | null> {
    return db.query.messageTemplates.findFirst({
      where: eq(messageTemplates.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
          },
        },
        property: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create a new template
   */
  async createTemplate(
    templateData: NewMessageTemplate
  ): Promise<TemplateWithUser> {
    const [createdTemplate] = await db
      .insert(messageTemplates)
      .values(templateData)
      .returning();

    return this.findTemplateById(
      createdTemplate.id
    ) as Promise<TemplateWithUser>;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    templateData: Partial<NewMessageTemplate>
  ): Promise<TemplateWithUser> {
    await db
      .update(messageTemplates)
      .set({
        ...templateData,
        updatedAt: new Date(),
      })
      .where(eq(messageTemplates.id, id));

    return this.findTemplateById(id) as Promise<TemplateWithUser>;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
  }

  /**
   * Get tenant contact details
   */
  async getTenantContacts(tenantIds: string[]): Promise<any[]> {
    return db.query.tenants.findMany({
      where: ({ id }) => {
        return id.in(tenantIds);
      },
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
  }
}

// Export a singleton instance
export const messagingRepository = new MessagingRepository();
