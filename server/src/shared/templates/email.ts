// src/emails/templates.ts
import AWS from "aws-sdk";
import nodemailer from "nodemailer";

// Configure your email service (e.g., AWS SES)
// For production, use environment variables for credentials
const configureEmailService = () => {
  if (process.env.EMAIL_SERVICE === "ses") {
    // Configure AWS SES
    const ses = new AWS.SES({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    return nodemailer.createTransport({
      SES: { ses, aws: AWS },
    });
  } else {
    // Use SMTP transport as fallback
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
};

// Email transport
const transporter = configureEmailService();

// Base app information
const appInfo = {
  name: process.env.APP_NAME || "Property Management System",
  url: process.env.BASE_URL || "http://localhost:3000",
  logo: process.env.APP_LOGO || "https://example.com/logo.png",
  supportEmail: process.env.SUPPORT_EMAIL || "support@example.com",
};

// Email sending wrapper function
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  try {
    const result = await transporter.sendMail({
      from: `"${appInfo.name}" <${process.env.EMAIL_FROM || "noreply@example.com"}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Email templates
// Email verification template
export const sendVerificationEmail = async ({
  user,
  url,
  token,
}: {
  user: any;
  url: string;
  token: string;
}) => {
  const subject = `Verify your email for ${appInfo.name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${appInfo.logo}" alt="${appInfo.name}" style="max-width: 200px;">
      </div>
      
      <h2>Verify Your Email Address</h2>
      
      <p>Hello ${user.name || user.email},</p>
      
      <p>Thank you for signing up for ${appInfo.name}. To complete your registration, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${url}</p>
      
      <p>This link will expire in 24 hours.</p>
      
      <p>If you did not sign up for ${appInfo.name}, please ignore this email.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${appInfo.name}. All rights reserved.</p>
        <p>If you need assistance, please contact us at ${appInfo.supportEmail}</p>
      </div>
    </div>
  `;

  const text = `
    Verify Your Email Address
    
    Hello ${user.name || user.email},
    
    Thank you for signing up for ${appInfo.name}. To complete your registration, please verify your email address by visiting this link:
    
    ${url}
    
    This link will expire in 24 hours.
    
    If you did not sign up for ${appInfo.name}, please ignore this email.
    
    If you need assistance, please contact us at ${appInfo.supportEmail}
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

// Reset password template
export const sendResetPasswordEmail = async ({
  user,
  url,
  token,
}: {
  user: any;
  url: string;
  token: string;
}) => {
  const subject = `Reset your password for ${appInfo.name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${appInfo.logo}" alt="${appInfo.name}" style="max-width: 200px;">
      </div>
      
      <h2>Reset Your Password</h2>
      
      <p>Hello ${user.name || user.email},</p>
      
      <p>We received a request to reset your password for ${appInfo.name}. Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${url}</p>
      
      <p>This link will expire in 1 hour.</p>
      
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${appInfo.name}. All rights reserved.</p>
        <p>If you need assistance, please contact us at ${appInfo.supportEmail}</p>
      </div>
    </div>
  `;

  const text = `
    Reset Your Password
    
    Hello ${user.name || user.email},
    
    We received a request to reset your password for ${appInfo.name}. Please visit this link to reset your password:
    
    ${url}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
    If you need assistance, please contact us at ${appInfo.supportEmail}
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

// Organization invitation template
export const sendOrganizationInvitation = async ({
  email,
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink,
}: {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}) => {
  const subject = `You've been invited to join ${teamName} on ${appInfo.name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${appInfo.logo}" alt="${appInfo.name}" style="max-width: 200px;">
      </div>
      
      <h2>You've Been Invited!</h2>
      
      <p>Hello,</p>
      
      <p><strong>${invitedByUsername}</strong> (${invitedByEmail}) has invited you to join <strong>${teamName}</strong> on ${appInfo.name}.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${inviteLink}</p>
      
      <p>This invitation will expire in 7 days.</p>
      
      <p>${appInfo.name} is a comprehensive property management system that helps you manage properties, tenants, leases, and more.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${appInfo.name}. All rights reserved.</p>
        <p>If you need assistance, please contact us at ${appInfo.supportEmail}</p>
      </div>
    </div>
  `;

  const text = `
    You've Been Invited!
    
    Hello,
    
    ${invitedByUsername} (${invitedByEmail}) has invited you to join ${teamName} on ${appInfo.name}.
    
    Accept the invitation by visiting this link:
    
    ${inviteLink}
    
    This invitation will expire in 7 days.
    
    ${appInfo.name} is a comprehensive property management system that helps you manage properties, tenants, leases, and more.
    
    If you need assistance, please contact us at ${appInfo.supportEmail}
  `;

  return sendEmail({ to: email, subject, html, text });
};

// Change email verification template
export const sendChangeEmailVerification = async ({
  user,
  newEmail,
  url,
  token,
}: {
  user: any;
  newEmail: string;
  url: string;
  token: string;
}) => {
  const subject = `Verify your new email address for ${appInfo.name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${appInfo.logo}" alt="${appInfo.name}" style="max-width: 200px;">
      </div>
      
      <h2>Verify Your New Email Address</h2>
      
      <p>Hello ${user.name || user.email},</p>
      
      <p>We received a request to change your email address for ${appInfo.name} from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.</p>
      
      <p>To confirm this change, please click the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify New Email</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${url}</p>
      
      <p>This link will expire in 24 hours.</p>
      
      <p>If you did not request this change, please ignore this email or contact support immediately.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${appInfo.name}. All rights reserved.</p>
        <p>If you need assistance, please contact us at ${appInfo.supportEmail}</p>
      </div>
    </div>
  `;

  const text = `
    Verify Your New Email Address
    
    Hello ${user.name || user.email},
    
    We received a request to change your email address for ${appInfo.name} from ${user.email} to ${newEmail}.
    
    To confirm this change, please visit this link:
    
    ${url}
    
    This link will expire in 24 hours.
    
    If you did not request this change, please ignore this email or contact support immediately.
    
    If you need assistance, please contact us at ${appInfo.supportEmail}
  `;

  return sendEmail({ to: newEmail, subject, html, text });
};

// Delete account verification template
export const sendDeleteAccountVerification = async ({
  user,
  url,
  token,
}: {
  user: any;
  url: string;
  token: string;
}) => {
  const subject = `Confirm account deletion for ${appInfo.name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${appInfo.logo}" alt="${appInfo.name}" style="max-width: 200px;">
      </div>
      
      <h2>Confirm Account Deletion</h2>
      
      <p>Hello ${user.name || user.email},</p>
      
      <p>We received a request to delete your account from ${appInfo.name}. This action is permanent and cannot be undone.</p>
      
      <p>If you wish to proceed with account deletion, please click the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirm Account Deletion</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${url}</p>
      
      <p>This link will expire in 24 hours.</p>
      
      <p>If you did not request account deletion, please contact support immediately.</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${appInfo.name}. All rights reserved.</p>
        <p>If you need assistance, please contact us at ${appInfo.supportEmail}</p>
      </div>
    </div>
  `;

  const text = `
    Confirm Account Deletion
    
    Hello ${user.name || user.email},
    
    We received a request to delete your account from ${appInfo.name}. This action is permanent and cannot be undone.
    
    If you wish to proceed with account deletion, please visit this link:
    
    ${url}
    
    This link will expire in 24 hours.
    
    If you did not request account deletion, please contact support immediately.
    
    If you need assistance, please contact us at ${appInfo.supportEmail}
  `;

  return sendEmail({ to: user.email, subject, html, text });
};

// Export all email functions
export default {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendOrganizationInvitation,
  sendChangeEmailVerification,
  sendDeleteAccountVerification,
};
