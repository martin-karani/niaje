import { EMAIL_CONFIG } from "@/shared/constants/enviroment";
import { format } from "date-fns";
import nodemailer from "nodemailer";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // this.transporter = nodemailer.createTransport({
    //   host: EMAIL_CONFIG.SMTP_HOST,
    //   port: EMAIL_CONFIG.SMTP_PORT,
    //   secure: EMAIL_CONFIG.SMTP_SECURE,
    //   auth: {
    //     user: EMAIL_CONFIG.SMTP_USER,
    //     pass: EMAIL_CONFIG.SMTP_PASSWORD,
    //   },
    // });
    this.transporter = nodemailer.createTransport(EMAIL_CONFIG.EMAIL_SERVER);
  }

  /**
   * Send an email
   */
  async sendEmail({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<any> {
    try {
      const result = await this.transporter.sendMail({
        from: `"${EMAIL_CONFIG.EMAIL_FROM_NAME}" <${EMAIL_CONFIG.EMAIL_FROM_ADDRESS}>`,
        to,
        subject,
        html,
        text,
      });

      console.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail({
    user,
    url,
    token,
  }: {
    user: { email: string; name: string };
    url: string;
    token: string;
  }): Promise<any> {
    const subject = `Verify your email for ${EMAIL_CONFIG.EMAIL_FROM_NAME}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not sign up for our service, please ignore this email.</p>
      </div>
    `;

    const text = `
      Verify Your Email Address
      
      Hello ${user.name},
      
      Thank you for signing up! To complete your registration, please verify your email address by visiting this link:
      
      ${url}
      
      This link will expire in 24 hours.
      
      If you did not sign up for our service, please ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send reset password email
   */
  async sendResetPasswordEmail({
    user,
    url,
    token,
  }: {
    user: { email: string; name: string };
    url: string;
    token: string;
  }): Promise<any> {
    const subject = `Reset your password for ${EMAIL_CONFIG.EMAIL_FROM_NAME}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
    `;

    const text = `
      Reset Your Password
      
      Hello ${user.name},
      
      We received a request to reset your password. Please visit this link to reset it:
      
      ${url}
      
      This link will expire in 1 hour.
      
      If you did not request a password reset, please ignore this email or contact support if you have concerns.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send email verification change
   */
  async sendChangeEmailVerification({
    user,
    newEmail,
    url,
    token,
  }: {
    user: { email: string; name: string };
    newEmail: string;
    url: string;
    token: string;
  }): Promise<any> {
    const subject = `Verify your new email address for ${EMAIL_CONFIG.EMAIL_FROM_NAME}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your New Email Address</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to change your email address from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.</p>
        <p>To confirm this change, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify New Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this change, please ignore this email or contact support if you have concerns.</p>
      </div>
    `;

    const text = `
      Verify Your New Email Address
      
      Hello ${user.name},
      
      We received a request to change your email address from ${user.email} to ${newEmail}.
      
      To confirm this change, please visit this link:
      
      ${url}
      
      This link will expire in 24 hours.
      
      If you did not request this change, please ignore this email or contact support if you have concerns.
    `;

    return this.sendEmail({
      to: newEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send trial welcome email
   */
  async sendTrialWelcomeEmail(
    email: string,
    name: string,
    organizationName: string,
    trialExpiresAt: Date
  ): Promise<any> {
    const subject = `Welcome to ${organizationName}`;
    const formattedExpiryDate = format(trialExpiresAt, "MMMM dd, yyyy");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${organizationName}!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for signing up for our property management system. Your trial period has started and will expire on <strong>${formattedExpiryDate}</strong>.</p>
        <p>During your trial, you'll have access to all our features including:</p>
        <ul>
          <li>Property and unit management</li>
          <li>Tenant and lease tracking</li>
          <li>Maintenance request handling</li>
          <li>Basic financial reporting</li>
        </ul>
        <p>We hope you enjoy using our platform!</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
      </div>
    `;

    const text = `
      Welcome to ${organizationName}!
      
      Hello ${name},
      
      Thank you for signing up for our property management system. Your trial period has started and will expire on ${formattedExpiryDate}.
      
      During your trial, you'll have access to all our features including:
      - Property and unit management
      - Tenant and lease tracking
      - Maintenance request handling
      - Basic financial reporting
      
      We hope you enjoy using our platform!
      
      If you have any questions, please don't hesitate to contact our support team.
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send organization invitation email
   */
  async sendOrganizationInvitationEmail(
    email: string,
    organizationName: string,
    inviterName: string,
    token: string,
    role: string
  ): Promise<any> {
    const subject = `You've been invited to join ${organizationName}`;
    const inviteUrl = `${process.env.FRONTEND_URL}/invitation/accept?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've Been Invited!</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a ${role}.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
        <p>This invitation will expire in 7 days.</p>
        <p>Our property management system helps you manage properties, tenants, leases, and more.</p>
      </div>
    `;

    const text = `
      You've Been Invited!
      
      Hello,
      
      ${inviterName} has invited you to join ${organizationName} as a ${role}.
      
      Accept the invitation by visiting this link:
      
      ${inviteUrl}
      
      This invitation will expire in 7 days.
      
      Our property management system helps you manage properties, tenants, leases, and more.
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send tenant portal credentials
   */
  async sendTenantPortalCredentials(
    email: string,
    name: string,
    password: string
  ): Promise<any> {
    const subject = `Your Tenant Portal Account`;
    const loginUrl = `${process.env.FRONTEND_URL}/tenant/login`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Your Tenant Portal</h2>
        <p>Hello ${name},</p>
        <p>Your tenant portal account has been created. You can now access the portal to view your lease information, make payments, and submit maintenance requests.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please login and change your password immediately for security reasons.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
        </div>
      </div>
    `;

    const text = `
      Welcome to Your Tenant Portal
      
      Hello ${name},
      
      Your tenant portal account has been created. You can now access the portal to view your lease information, make payments, and submit maintenance requests.
      
      Email: ${email}
      Password: ${password}
      
      Please login and change your password immediately for security reasons.
      
      Login here: ${loginUrl}
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}

const emailService = new EmailService();
export default emailService;
