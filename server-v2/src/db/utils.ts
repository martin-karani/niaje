import { customAlphabet } from "nanoid";

// Create a custom ID generator similar to Prisma's cuid
export const createId = () => {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
  return nanoid();
};
