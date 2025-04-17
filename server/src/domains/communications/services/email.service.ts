import { EMAIL_CONFIG, SERVER_CONFIG } from "@/config/environment";
import { loadEmailTemplate } from "@/shared/utils/email.utils";
import { format } from "date-fns";
import nodemailer from "nodemailer";

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.SMTP_HOST,
  port: EMAIL_CONFIG.SMTP_PORT,
  secure: EMAIL_CONFIG.SMTP_SECURE,
  auth: {
    user: EMAIL_CONFIG.SMTP_USER,
    pass: EMAIL_CONFIG.SMTP_PASSWORD,
  },
});

export class EmailService {
  /**
   * Send welcome email to new organization
   */
  async sendTrialWelcomeEmail(
    email: string,
    name: string,
    organizationName: string,
    expiryDate: Date
  ) {
    const template = await loadEmailTemplate("trial-welcome");
    const formattedDate = format(expiryDate, "MMMM d, yyyy");

    const html = template
      .replace("{{name}}", name)
      .replace("{{organizationName}}", organizationName)
      .replace("{{trialEndDate}}", formattedDate)
      .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Welcome to Your ${organizationName} Trial!`,
      html,
    });
  }

  /**
   * Send trial expiry reminder
   */
  async sendTrialExpiringEmail(
    email: string,
    name: string,
    organizationName: string,
    daysLeft: number
  ) {
    const template = await loadEmailTemplate("trial-expiring");

    const html = template
      .replace("{{name}}", name)
      .replace("{{organizationName}}", organizationName)
      .replace("{{daysLeft}}", daysLeft.toString())
      .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Your Trial Ends in ${daysLeft} Days`,
      html,
    });
  }

  /**
   * Send trial expired notification
   */
  async sendTrialExpiredEmail(
    email: string,
    name: string,
    organizationName: string
  ) {
    const template = await loadEmailTemplate("trial-expired");

    const html = template
      .replace("{{name}}", name)
      .replace("{{organizationName}}", organizationName)
      .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Your Trial Has Expired`,
      html,
    });
  }

  /**
   * Send subscription confirmation
   */
  async sendSubscriptionConfirmationEmail(
    email: string,
    name: string,
    organizationName: string,
    planName: string
  ) {
    const template = await loadEmailTemplate("subscription-confirmed");

    const html = template
      .replace("{{name}}", name)
      .replace("{{organizationName}}", organizationName)
      .replace("{{planName}}", planName)
      .replace("{{frontendUrl}}", EMAIL_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Subscription Confirmed`,
      html,
    });
  }

  /**
   * Send lease expiry reminder to tenant
   */
  async sendLeaseExpiryReminder(
    email: string,
    name: string,
    propertyName: string,
    unitName: string,
    expiryDate: string,
    daysLeft: number
  ) {
    const template = await loadEmailTemplate("lease-expiry");

    const html = template
      .replace("{{name}}", name)
      .replace("{{propertyName}}", propertyName)
      .replace("{{unitName}}", unitName)
      .replace("{{expiryDate}}", expiryDate)
      .replace("{{daysLeft}}", daysLeft.toString())
      .replace("{{frontendUrl}}", EMAIL_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Your Lease Expires in ${daysLeft} Days`,
      html,
    });
  }

  /**
   * Send rent due reminder to tenant
   */
  async sendRentDueReminder(
    email: string,
    name: string,
    propertyName: string,
    unitName: string,
    dueDate: string,
    amount: number,
    currency: string
  ) {
    const template = await loadEmailTemplate("rent-due");

    const html = template
      .replace("{{name}}", name)
      .replace("{{propertyName}}", propertyName)
      .replace("{{unitName}}", unitName)
      .replace("{{dueDate}}", dueDate)
      .replace("{{amount}}", amount.toFixed(2))
      .replace("{{currency}}", currency)
      .replace("{{frontendUrl}}", EMAIL_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Rent Due Reminder - ${dueDate}`,
      html,
    });
  }

  /**
   * Send maintenance request update to tenant
   */
  async sendMaintenanceUpdate(
    email: string,
    name: string,
    requestTitle: string,
    newStatus: string,
    unitName: string,
    message: string
  ) {
    const template = await loadEmailTemplate("maintenance-update");

    const html = template
      .replace("{{name}}", name)
      .replace("{{requestTitle}}", requestTitle)
      .replace("{{newStatus}}", newStatus)
      .replace("{{unitName}}", unitName)
      .replace("{{message}}", message)
      .replace("{{frontendUrl}}", EMAIL_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Maintenance Request Update - ${requestTitle}`,
      html,
    });
  }

  /**
   * Send new maintenance request notification to property manager
   */
  async sendNewMaintenanceRequestNotification(
    email: string,
    name: string,
    requestTitle: string,
    propertyName: string,
    unitName: string,
    requestId: string
  ) {
    const template = await loadEmailTemplate("new-maintenance-request");

    const html = template
      .replace("{{name}}", name)
      .replace("{{requestTitle}}", requestTitle)
      .replace("{{propertyName}}", propertyName)
      .replace("{{unitName}}", unitName)
      .replace("{{requestId}}", requestId)
      .replace("{{frontendUrl}}", EMAIL_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `New Maintenance Request - ${propertyName}`,
      html,
    });
  }

  /**
   * Send tenant portal login credentials
   */
  async sendTenantPortalCredentials(
    email: string,
    name: string,
    password: string // This should be a temporary password
  ) {
    const template = await loadEmailTemplate("tenant-portal-welcome");

    const html = template
      .replace("{{name}}", name)
      .replace("{{email}}", email)
      .replace("{{password}}", password)
      .replace("{{frontendUrl}}", EMAIL_CONFIG.FRONTEND_URL || "");

    await this.sendEmail({
      to: email,
      subject: `Your Tenant Portal Login Information`,
      html,
    });
  }

  /**
   * Low-level email sending function
   */
  private async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: any[];
  }) {
    try {
      const defaultFrom = `"${EMAIL_CONFIG.EMAIL_FROM_NAME}" <${EMAIL_CONFIG.EMAIL_FROM_ADDRESS}>`;

      const result = await transporter.sendMail({
        from: options.from || defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments,
      });

      return result;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
