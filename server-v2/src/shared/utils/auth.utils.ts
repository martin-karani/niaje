// src/utils/auth.utils.ts
import crypto from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(crypto.pbkdf2);

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await pbkdf2Async(
    password,
    salt,
    10000, // iterations
    64, // key length
    "sha512"
  );

  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");

  const derivedKey = await pbkdf2Async(
    password,
    salt,
    10000, // iterations (must match what was used for hashing)
    64, // key length (must match what was used for hashing)
    "sha512"
  );

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), derivedKey);
}

/**
 * Generate a random token
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a temporary password
 */
export function generateTemporaryPassword(length = 10): string {
  // Use a mix of characters for a stronger password
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars[randomIndex];
  }

  return password;
}
