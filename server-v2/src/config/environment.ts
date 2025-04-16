// src/config/environment.ts
import dotenv from "dotenv";

dotenv.config();

// Server configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  BASE_URL: process.env.BASE_URL || "http://localhost:3001",
};

// Database configuration
export const DB_CONFIG = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://propertyapp:propertypassword@localhost:5432/propertymanagement",
};

// Auth configuration
export const AUTH_CONFIG = {
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET || "better-auth-secret-123456789",
};

// Payment configuration
export const PAYMENT_CONFIG = {
  FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
  FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_SECRET_HASH: process.env.FLUTTERWAVE_SECRET_HASH,
  COMPANY_LOGO_URL: process.env.COMPANY_LOGO_URL,
};

// Email configuration
export const EMAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "Property Management",
  EMAIL_FROM_ADDRESS:
    process.env.EMAIL_FROM_ADDRESS || "noreply@yourcompany.com",
};

// Storage configuration
export const STORAGE_CONFIG = {
  STORAGE_TYPE: process.env.STORAGE_TYPE || "local", // "local", "s3", "azure"
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
};

// Currency configuration
export const CURRENCY_CONFIG = {
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || "KES",
  DEFAULT_CURRENCY_SYMBOL: process.env.DEFAULT_CURRENCY_SYMBOL || "KSh",
};

// Validate required configuration
export function validateConfig() {
  const requiredConfigs = [
    { value: DB_CONFIG.DATABASE_URL, name: "DATABASE_URL" },
    { value: AUTH_CONFIG.BETTER_AUTH_SECRET, name: "BETTER_AUTH_SECRET" },
  ];

  for (const config of requiredConfigs) {
    if (!config.value) {
      throw new Error(
        `Required environment variable ${config.name} is not set.`
      );
    }
  }
}
