"use client";

import { ReactNode } from "react";
import { AuthProvider as BetterAuthProvider } from "@/lib/auth-client";

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <BetterAuthProvider>{children}</BetterAuthProvider>;
}

// Re-export hooks from auth-client for convenience
export { 
  useAuth, 
  useUser, 
  useSignIn, 
  useSignUp, 
  useSignOut, 
  useIsAuthenticated 
} from "@/lib/auth-client";