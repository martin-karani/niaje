import { EMAIL_CONFIG, SERVER_CONFIG } from "@/shared/constants/enviroment";
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

/**
 * Low-level email sending function
 */
export async function sendEmail(options: {
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

/**
 * Send welcome email to new organization
 */
export async function sendTrialWelcomeEmail(
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

  await sendEmail({
    to: email,
    subject: `Welcome to Your ${organizationName} Trial!`,
    html,
  });
}

/**
 * Send trial expiry reminder
 */
export async function sendTrialExpiringEmail(
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

  await sendEmail({
    to: email,
    subject: `Your Trial Ends in ${daysLeft} Days`,
    html,
  });
}

/**
 * Send trial expired notification
 */
export async function sendTrialExpiredEmail(
  email: string,
  name: string,
  organizationName: string
) {
  const template = await loadEmailTemplate("trial-expired");

  const html = template
    .replace("{{name}}", name)
    .replace("{{organizationName}}", organizationName)
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `Your Trial Has Expired`,
    html,
  });
}

/**
 * Send subscription confirmation
 */
export async function sendSubscriptionConfirmationEmail(
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
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `Subscription Confirmed`,
    html,
  });
}

/**
 * Send organization invitation email
 */
export async function sendOrganizationInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  token: string,
  role: string
) {
  const template = await loadEmailTemplate("organization-invitation");
  const inviteUrl = `${SERVER_CONFIG.FRONTEND_URL}/invitation/accept?token=${token}`;

  const html = template
    .replace("{{organizationName}}", organizationName)
    .replace("{{inviterName}}", inviterName)
    .replace("{{role}}", role)
    .replace("{{inviteUrl}}", inviteUrl)
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `Invitation to join ${organizationName}`,
    html,
  });
}

/**
 * Send lease expiry reminder to tenant
 */
export async function sendLeaseExpiryReminder(
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
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `Your Lease Expires in ${daysLeft} Days`,
    html,
  });
}

/**
 * Send rent due reminder to tenant
 */
export async function sendRentDueReminder(
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
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `Rent Due Reminder - ${dueDate}`,
    html,
  });
}

/**
 * Send maintenance request update to tenant
 */
export async function sendMaintenanceUpdate(
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
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `Maintenance Request Update - ${requestTitle}`,
    html,
  });
}

/**
 * Send new maintenance request notification to property manager
 */
export async function sendNewMaintenanceRequestNotification(
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
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `New Maintenance Request - ${propertyName}`,
    html,
  });
}

/**
 * Send tenant portal login credentials
 */
export async function sendTenantPortalCredentials(
  email: string,
  name: string,
  password: string // This should be a temporary password
) {
  const template = await loadEmailTemplate("tenant-portal-welcome");

  const html = template
    .replace("{{name}}", name)
    .replace("{{email}}", email)
    .replace("{{password}}", password)
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: email,
    subject: `Your Tenant Portal Login Information`,
    html,
  });
}

/**
 * Send email verification - For better-auth integration
 */
export async function sendVerificationEmail(data: {
  user: { email: string; name?: string };
  url: string;
  token: string;
}) {
  const template = await loadEmailTemplate("email-verification");

  const html = template
    .replace("{{name}}", data.user.name || data.user.email)
    .replace("{{email}}", data.user.email)
    .replace("{{verificationUrl}}", data.url)
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: data.user.email,
    subject: `Verify Your Email Address`,
    html,
  });
}

/**
 * Send password reset email - For better-auth integration
 */
export async function sendResetPasswordEmail(data: {
  user: { email: string; name?: string };
  url: string;
  token: string;
}) {
  const template = await loadEmailTemplate("reset-password");

  const html = template
    .replace("{{name}}", data.user.name || data.user.email)
    .replace("{{email}}", data.user.email)
    .replace("{{resetUrl}}", data.url)
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: data.user.email,
    subject: `Reset Your Password`,
    html,
  });
}

/**
 * Send email change verification - For better-auth integration
 */
export async function sendChangeEmailVerification(data: {
  user: { email: string; name?: string };
  newEmail: string;
  url: string;
  token: string;
}) {
  const template = await loadEmailTemplate("change-email-verification");

  const html = template
    .replace("{{name}}", data.user.name || data.user.email)
    .replace("{{currentEmail}}", data.user.email)
    .replace("{{newEmail}}", data.newEmail)
    .replace("{{verificationUrl}}", data.url)
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: data.newEmail,
    subject: `Verify Your New Email Address`,
    html,
  });
}

/**
 * Send account deletion verification - For better-auth integration
 */
export async function sendDeleteAccountVerification(data: {
  user: { email: string; name?: string };
  url: string;
  token: string;
}) {
  const template = await loadEmailTemplate("delete-account-verification");

  const html = template
    .replace("{{name}}", data.user.name || data.user.email)
    .replace("{{email}}", data.user.email)
    .replace("{{verificationUrl}}", data.url)
    .replace("{{frontendUrl}}", SERVER_CONFIG.FRONTEND_URL || "");

  await sendEmail({
    to: data.user.email,
    subject: `Confirm Account Deletion`,
    html,
  });
}

/**
 * Send better-auth organization invitation - adapter for better-auth
 */
export async function sendOrganizationInvitation(data: {
  email: string;
  inviter: { user: { name: string; email: string } };
  organization: { name: string };
  id: string;
}) {
  await sendOrganizationInvitationEmail(
    data.email,
    data.organization.name,
    data.inviter.user.name || data.inviter.user.email,
    data.id, // This is the invitation URL
    "member" // Default role, will be specified in the invitation
  );
}

// Export a cohesive email service object for backward compatibility
export const emailService = {
  sendEmail,
  sendTrialWelcomeEmail,
  sendTrialExpiringEmail,
  sendTrialExpiredEmail,
  sendSubscriptionConfirmationEmail,
  sendOrganizationInvitationEmail,
  sendLeaseExpiryReminder,
  sendRentDueReminder,
  sendMaintenanceUpdate,
  sendNewMaintenanceRequestNotification,
  sendTenantPortalCredentials,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendChangeEmailVerification,
  sendDeleteAccountVerification,
  sendOrganizationInvitation,
};

export default emailService;
