import { createId } from "@/db/utils";
import { ConflictError, NotFoundError } from "@/errors";
import { MessageFilterDto, SendMessageDto } from "../dto/messaging.dto";
import { MessageWithRecipients, SendMessageResult } from "../types";
import { messagingClientsService } from "./messaging-clients.service";

export class MessagingService {
  constructor(
    private readonly messagingRepository: MessagingRepository,
    private readonly messagingClients = messagingClientsService
  ) {}

  /**
   * Get messages with filtering and pagination
   */
  async getMessages(
    filters: MessageFilterDto,
    userId: string,
    userRole: string
  ): Promise<{
    messages: MessageWithRecipients[];
    total: number;
    pages: number;
  }> {
    // Check user permissions based on role
    // For simplicity, we're assuming all users can view messages
    // In a real app, you'd check for specific permissions

    const messages = await this.messagingRepository.findAll(filters);
    const total = await this.messagingRepository.countMessages(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { messages, total, pages };
  }

  /**
   * Get a message by ID
   */
  async getMessageById(
    messageId: string,
    userId: string,
    userRole: string
  ): Promise<MessageWithRecipients> {
    const message = await this.messagingRepository.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // Check if user has permission to view this message
    // In a real app, check if user is sender or has permission for property

    return message;
  }

  /**
   * Send a new message
   */
  async sendMessage(
    messageData: SendMessageDto,
    userId: string,
    userRole: string
  ): Promise<SendMessageResult> {
    // Validate if message type is email and subject is required
    if (messageData.messageType === "email" && !messageData.subject) {
      throw new ConflictError("Subject is required for email messages");
    }

    // Check if messaging services are configured
    const serviceConfig = this.messagingClients.isConfigured();
    if (
      (messageData.messageType === "email" && !serviceConfig.email) ||
      (messageData.messageType === "sms" && !serviceConfig.sms)
    ) {
      throw new ConflictError(
        `${messageData.messageType.toUpperCase()} service is not properly configured`
      );
    }

    // Get tenant contact details
    const tenants = await this.messagingRepository.getTenantContacts(
      messageData.tenantIds
    );

    if (tenants.length === 0) {
      throw new NotFoundError("No valid tenants found");
    }

    try {
      // Create the message record
      const newMessage = await this.messagingRepository.createMessage({
        id: createId(),
        propertyId: messageData.propertyId || null,
        senderId: userId,
        type: messageData.messageType,
        subject: messageData.subject || null,
        content: messageData.messageText,
        status: "pending", // Initial status
        recipientCount: tenants.length.toString(),
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Prepare recipient records
      const recipientRecords = tenants.map((tenant) => ({
        id: createId(),
        messageId: newMessage.id,
        tenantId: tenant.id,
        deliveryStatus: "pending",
        errorMessage: null,
        deliveredAt: null,
        createdAt: new Date(),
      }));

      // Add recipients
      await this.messagingRepository.addRecipients(
        newMessage.id,
        recipientRecords
      );

      // Send the actual messages via external services
      let successCount = 0;
      let failedCount = 0;
      const deliveryResults = [];

      // Process based on message type
      if (messageData.messageType === "email") {
        // Prepare recipient emails
        const emailRecipients = tenants
          .filter((tenant) => tenant.email)
          .map((tenant) => ({
            email: tenant.email,
            tenantId: tenant.id,
          }));

        if (emailRecipients.length === 0) {
          throw new ConflictError("No recipients have valid email addresses");
        }

        // Send the email via SendGrid
        const emailResult = await this.messagingClients.sendEmail(
          emailRecipients.map((r) => r.email),
          messageData.subject || "Property Management Notification",
          messageData.messageText
        );

        // Update recipient statuses
        if (emailResult.success) {
          successCount = emailRecipients.length;

          // Update all recipients as delivered
          await Promise.all(
            emailRecipients.map(async (recipient) => {
              const recipientRecord = recipientRecords.find(
                (r) => r.tenantId === recipient.tenantId
              );

              if (recipientRecord) {
                await this.messagingRepository.updateRecipientStatus(
                  recipientRecord.id,
                  "delivered",
                  null,
                  new Date()
                );
              }
            })
          );
        } else {
          failedCount = emailRecipients.length;

          // Update all recipients as failed
          await Promise.all(
            emailRecipients.map(async (recipient) => {
              const recipientRecord = recipientRecords.find(
                (r) => r.tenantId === recipient.tenantId
              );

              if (recipientRecord) {
                await this.messagingRepository.updateRecipientStatus(
                  recipientRecord.id,
                  "failed",
                  emailResult.error || "Failed to send email",
                  null
                );
              }
            })
          );
        }

        deliveryResults.push(emailResult);
      } else if (messageData.messageType === "sms") {
        // Send SMS messages individually to each tenant with a phone number
        const smsRecipients = tenants
          .filter((tenant) => tenant.phone)
          .map((tenant) => ({
            phone: tenant.phone,
            tenantId: tenant.id,
          }));

        if (smsRecipients.length === 0) {
          throw new ConflictError("No recipients have valid phone numbers");
        }

        // Send SMS messages and track results
        for (const recipient of smsRecipients) {
          const recipientRecord = recipientRecords.find(
            (r) => r.tenantId === recipient.tenantId
          );

          if (!recipientRecord) continue;

          const smsResult = await this.messagingClients.sendSms(
            recipient.phone,
            messageData.messageText
          );

          deliveryResults.push(smsResult);

          if (smsResult.success) {
            successCount++;
            await this.messagingRepository.updateRecipientStatus(
              recipientRecord.id,
              "delivered",
              null,
              new Date()
            );
          } else {
            failedCount++;
            await this.messagingRepository.updateRecipientStatus(
              recipientRecord.id,
              "failed",
              smsResult.error || "Failed to send SMS",
              null
            );
          }
        }
      }

      // Update the message status based on delivery results
      const messageStatus =
        failedCount === 0 ? "sent" : successCount === 0 ? "failed" : "partial";

      await this.messagingRepository.updateMessageStatus(
        newMessage.id,
        messageStatus,
        { deliveryResults }
      );

      // Get the updated message with recipients
      const message = await this.messagingRepository.findById(newMessage.id);

      if (!message) {
        throw new Error("Failed to retrieve message after creation");
      }

      return {
        message,
        successCount,
        failedCount,
      };
    } catch (error: any) {
      // Handle specific errors
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }

      // Log and rethrow other errors
      console.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }
}
