import { auth } from "@/auth/configs/auth.config";
import { toNodeHandler } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

/**
 * Handle all auth requests and pass to better-auth
 */
export async function handleAuthRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await toNodeHandler(auth);
  } catch (error) {
    next(error);
  }
}
