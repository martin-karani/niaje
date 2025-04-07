import { UserRole } from "@/types/user";
import { User } from "@/utils/trpc-type";
import { Session } from "better-auth/types";

const API_URL = process.env.PUBLIC_API_URL || "http://localhost:3001";
const API_BASE_PATH = "/api/auth";

// Common error type for all auth operations
export interface AuthError {
  code: string;
  message: string;
  status?: number;
}

// Response interfaces
export interface AuthResponse<T> {
  data: T | null;
  error: AuthError | null;
}

export interface UserResponse extends AuthResponse<User> {}
export interface SessionResponse extends AuthResponse<Session> {}

export interface UserSessionResponse
  extends AuthResponse<{
    user: User;
    session: Session;
  }> {}

// Improved error handling function
const handleApiError = (error: any, fallbackMessage: string): AuthError => {
  if (error instanceof Response) {
    return {
      code: `HTTP_ERROR_${error.status}`,
      message: fallbackMessage,
      status: error.status,
    };
  }

  return {
    code: error.code || "UNKNOWN_ERROR",
    message: error.message || fallbackMessage,
  };
};

// Fetch wrapper with consistent error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<AuthResponse<T>> {
  try {
    const url = `${API_URL}${API_BASE_PATH}${endpoint}`;

    const fetchOptions = {
      ...options,
      credentials: "include" as RequestCredentials,
      headers: {
        ...options.headers,
        ...(options.method !== "GET" && { "Content-Type": "application/json" }),
      },
    };

    const response = await fetch(url, fetchOptions);

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          return {
            data: null,
            error: {
              code: "INVALID_JSON",
              message: "Server returned invalid JSON response",
              status: response.status,
            },
          };
        }
      } else {
        // Empty response
        data = null;
      }
    } else {
      // Not a JSON response
      data = null;
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          code: (data && data.code) || `HTTP_ERROR_${response.status}`,
          message:
            (data && data.message) ||
            `Request failed with status: ${response.status}`,
          status: response.status,
        },
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    return {
      data: null,
      error: handleApiError(error, `Failed to ${endpoint.replace("/", "")}`),
    };
  }
}

// Get user session
export async function getUserSession(): Promise<UserSessionResponse> {
  return apiFetch<{ user: User; session: Session }>("/get-session");
}

// Sign in with email
export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<UserResponse> {
  return apiFetch<User>("/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Sign up with email
export async function signUpWithEmail({
  name,
  email,
  password,
  role = "LANDLORD",
  callbackURL,
}: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  callbackURL?: string;
}): Promise<UserResponse> {
  return apiFetch<User>("/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      callbackURL,
      role,
      emailVerified: false,
    }),
  });
}

// Sign out
export async function signOut(): Promise<AuthResponse<boolean>> {
  return apiFetch<boolean>("/sign-out", {
    method: "POST",
  });
}
