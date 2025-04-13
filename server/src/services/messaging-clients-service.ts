import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { Twilio } from "twilio";

dotenv.config();

// Initialize the SendGrid client
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

// Initialize the Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID || "",
  process.env.TWILIO_AUTH_TOKEN || ""
);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";

/**
 * Service for sending messages via SendGrid (email) and Twilio (SMS)
 */
export class MessagingClientsService {
  /**
   * Send an email via SendGrid
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    content: string,
    fromName: string = "Property Management",
    fromEmail: string = process.env.DEFAULT_FROM_EMAIL ||
      "noreply@propertymanagement.com"
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Prepare recipients array
      const recipients = Array.isArray(to) ? to : [to];

      // Create the message
      const msg = {
        to: recipients,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject,
        text: content,
        html: content.replace(/\n/g, "<br>"),
      };

      // Send the email
      const response = await sgMail.send(msg);

      // Success response
      return {
        success: true,
        messageId: response[0]?.headers["x-message-id"],
      };
    } catch (error: any) {
      console.error("SendGrid error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }
  }

  /**
   * Send an SMS via Twilio
   */
  async sendSms(
    to: string | string[],
    content: string,
    from: string = twilioPhoneNumber
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Prepare recipients array
      const recipients = Array.isArray(to) ? to : [to];

      // For multiple recipients, we'll need to send individual messages
      // and collect the results
      const results = await Promise.all(
        recipients.map(async (recipient) => {
          try {
            const message = await twilioClient.messages.create({
              body: content,
              from,
              to: recipient,
            });

            return {
              success: true,
              messageId: message.sid,
              recipient,
            };
          } catch (smsError: any) {
            console.error(`Twilio error for ${recipient}:`, smsError);
            return {
              success: false,
              error: smsError.message || "Failed to send SMS",
              recipient,
            };
          }
        })
      );

      // Check if all messages were sent successfully
      const allSuccessful = results.every((result) => result.success);

      if (allSuccessful) {
        return {
          success: true,
          messageId: results.map((r) => r.messageId).join(","),
        };
      } else {
        // Some messages failed
        const failedRecipients = results
          .filter((r) => !r.success)
          .map((r) => r.recipient)
          .join(", ");

        return {
          success: false,
          error: `Failed to send SMS to: ${failedRecipients}`,
        };
      }
    } catch (error: any) {
      console.error("Twilio general error:", error);
      return {
        success: false,
        error: error.message || "Failed to send SMS",
      };
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): { email: boolean; sms: boolean } {
    return {
      email: !!process.env.SENDGRID_API_KEY,
      sms: !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      ),
    };
  }
}

// Export a singleton instance
export const messagingClientsService = new MessagingClientsService();
