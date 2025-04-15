// src/services/email.service.ts
import { format } from "date-fns";
import nodemailer from "nodemailer";

// Configure your email service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export class EmailService {
  async sendTrialWelcomeEmail(
    email: string,
    name: string,
    organizationName: string,
    expiryDate: Date
  ) {
    const formattedDate = format(expiryDate, "MMMM d, yyyy");

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Welcome to Your ${organizationName} Trial!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to Your Free Trial!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for creating an organization with our Property Management System. Your free trial for <strong>${organizationName}</strong> is now active!</p>
          <p>During your trial, you'll have access to all premium features including:</p>
          <ul>
            <li>Property management</li>
            <li>Tenant tracking</li>
            <li>Financial reporting</li>
            <li>Maintenance requests</li>
          </ul>
          <p>Your trial will expire on <strong>${formattedDate}</strong>.</p>
          <p>To ensure uninterrupted service after your trial, please set up your subscription before the trial ends.</p>
          <p><a href="${process.env.FRONTEND_URL}/organization/billing" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Manage Subscription</a></p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Enjoy your trial!</p>
        </div>
      `,
    });
  }

  async sendTrialExpiringEmail(
    email: string,
    name: string,
    organizationName: string,
    daysLeft: number
  ) {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Your Trial Ends in ${daysLeft} Days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Your Trial is Ending Soon</h1>
          <p>Hi ${name},</p>
          <p>Your free trial for <strong>${organizationName}</strong> will end in <strong>${daysLeft} days</strong>.</p>
          <p>To continue using all features without interruption, please subscribe to one of our plans.</p>
          <p><a href="${process.env.FRONTEND_URL}/organization/billing" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Subscribe Now</a></p>
          <p>If you have any questions about our subscription plans, please contact our support team.</p>
        </div>
      `,
    });
  }

  async sendTrialExpiredEmail(
    email: string,
    name: string,
    organizationName: string
  ) {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Your Trial Has Expired`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Your Trial Has Expired</h1>
          <p>Hi ${name},</p>
          <p>Your free trial for <strong>${organizationName}</strong> has now expired.</p>
          <p>To continue using our Property Management System, please subscribe to one of our plans.</p>
          <p><a href="${process.env.FRONTEND_URL}/organization/billing" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Subscribe Now</a></p>
          <p>If you have any questions about our subscription plans, please contact our support team.</p>
        </div>
      `,
    });
  }

  async sendSubscriptionConfirmationEmail(
    email: string,
    name: string,
    organizationName: string,
    planName: string
  ) {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Subscription Confirmed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Subscription Confirmed!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for subscribing to our Property Management System!</p>
          <p>Your <strong>${planName}</strong> plan for <strong>${organizationName}</strong> is now active.</p>
          <p>You now have full access to all features included in your subscription plan.</p>
          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
