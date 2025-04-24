import { Request } from "express";

interface CookieOptions {
  httpOnly?: boolean;

  secure?: boolean;

  sameSite?: "strict" | "lax" | "none";

  maxAge?: number;
}

export const setCookie = (
  req: Request,

  name: string,

  value: string,

  options: CookieOptions = {}
) => {
  req.res?.cookie(name, value, options);
};

export function clearCookie(req: Request, name: string) {
  req.cookies[name] = "";
}
