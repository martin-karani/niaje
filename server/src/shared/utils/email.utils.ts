import fs from "fs";
import path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);

/**
 * Default email templates
 */
const DEFAULT_TEMPLATES: Record<string, string> = {
  "trial-welcome": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to {{organizationName}}!</h2>
      <p>Hello {{name}},</p>
      <p>Thank you for signing up for our property management system. Your trial period has started and will expire on <strong>{{trialEndDate}}</strong>.</p>
      <p>During your trial, you'll have access to all our features including:</p>
      <ul>
        <li>Property and unit management</li>
        <li>Tenant and lease tracking</li>
        <li>Maintenance request handling</li>
        <li>Basic financial reporting</li>
      </ul>
      <p>We hope you enjoy using our platform!</p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <a href="{{frontendUrl}}/dashboard" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
    </div>
  `,

  "trial-expiring": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Trial Period is Ending Soon</h2>
      <p>Hello {{name}},</p>
      <p>Your trial period for {{organizationName}} will expire in <strong>{{daysLeft}} days</strong>.</p>
      <p>To continue using our platform without interruption, please upgrade to one of our subscription plans.</p>
      <a href="{{frontendUrl}}/billing/subscribe" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Upgrade Now</a>
      <p>If you have any questions about our subscription plans, please contact our support team.</p>
    </div>
  `,

  "trial-expired": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Trial Has Expired</h2>
      <p>Hello {{name}},</p>
      <p>Your trial period for {{organizationName}} has now expired.</p>
      <p>To continue using our platform, please subscribe to one of our plans.</p>
      <a href="{{frontendUrl}}/billing/subscribe" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Subscribe Now</a>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  `,

  "subscription-confirmed": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Subscription Confirmed</h2>
      <p>Hello {{name}},</p>
      <p>Thank you for subscribing to our {{planName}} plan for {{organizationName}}.</p>
      <p>Your subscription is now active and you have full access to all the features included in your plan.</p>
      <a href="{{frontendUrl}}/dashboard" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
      <p>If you have any questions about your subscription, please contact our support team.</p>
    </div>
  `,

  "organization-invitation": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Invitation to Join {{organizationName}}</h2>
      <p>You have been invited by {{inviterName}} to join {{organizationName}} as a {{role}}.</p>
      <p>Click the button below to accept the invitation and create your account:</p>
      <a href="{{inviteUrl}}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
      <p>This invitation link will expire in 7 days.</p>
      <p>If you have any questions, please contact the person who invited you.</p>
    </div>
  `,

  "lease-expiry": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Lease Expiration Notice</h2>
      <p>Hello {{name}},</p>
      <p>This is a reminder that your lease for <strong>{{propertyName}} - {{unitName}}</strong> is set to expire on <strong>{{expiryDate}}</strong>, which is {{daysLeft}} days from now.</p>
      <p>Please contact property management to discuss renewal options if you wish to continue your tenancy.</p>
      <a href="{{frontendUrl}}/tenant/lease" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Lease Details</a>
    </div>
  `,

  "rent-due": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Rent Payment Reminder</h2>
      <p>Hello {{name}},</p>
      <p>This is a reminder that your rent payment of <strong>{{currency}} {{amount}}</strong> for <strong>{{propertyName}} - {{unitName}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
      <p>Please ensure your payment is made on time to avoid late fees.</p>
      <a href="{{frontendUrl}}/tenant/payments" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Make Payment</a>
    </div>
  `,

  "maintenance-update": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Maintenance Request Update</h2>
      <p>Hello {{name}},</p>
      <p>Your maintenance request for <strong>"{{requestTitle}}"</strong> at <strong>{{unitName}}</strong> has been updated to status: <strong>{{newStatus}}</strong>.</p>
      <p>{{message}}</p>
      <a href="{{frontendUrl}}/tenant/maintenance" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a>
    </div>
  `,

  "new-maintenance-request": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Maintenance Request</h2>
      <p>Hello {{name}},</p>
      <p>A new maintenance request has been submitted:</p>
      <p><strong>Property:</strong> {{propertyName}}</p>
      <p><strong>Unit:</strong> {{unitName}}</p>
      <p><strong>Issue:</strong> {{requestTitle}}</p>
      <a href="{{frontendUrl}}/maintenance/{{requestId}}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a>
    </div>
  `,

  "tenant-portal-welcome": `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Your Tenant Portal</h2>
      <p>Hello {{name}},</p>
      <p>Your tenant portal account has been created. You can now access the portal to view your lease information, make payments, and submit maintenance requests.</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Password:</strong> {{password}}</p>
      <p>Please login and change your password immediately for security reasons.</p>
      <a href="{{frontendUrl}}/tenant/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Portal</a>
    </div>
  `,
};

/**
 * Load an email template by name
 * Looks for template file in templates directory first, falls back to default templates
 */
export async function loadEmailTemplate(templateName: string): Promise<string> {
  try {
    // First, try to load template from file system
    const templatePath = path.join(
      process.cwd(),
      "templates",
      "emails",
      `${templateName}.html`
    );

    try {
      const templateContent = await readFile(templatePath, "utf8");
      return templateContent;
    } catch (error) {
      // If file doesn't exist, fall back to default template
      if (DEFAULT_TEMPLATES[templateName]) {
        return DEFAULT_TEMPLATES[templateName];
      }

      throw new Error(`Email template '${templateName}' not found`);
    }
  } catch (error) {
    console.error(`Error loading email template '${templateName}':`, error);
    throw error;
  }
}

/**
 * Generate a random password for temporary use
 */
export function generateTemporaryPassword(length: number = 10): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}
