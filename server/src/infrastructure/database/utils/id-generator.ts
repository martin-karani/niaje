import { customAlphabet } from "nanoid";

export const createId = () => {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
  return nanoid();
};
