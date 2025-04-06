import { UserRole } from "@/types/user";

const API_URL = process.env.PUBLIC_API_URL || "http://localhost:3001";
const API_BASE_PATH = "/api/auth";

// Type for sign-up response
interface SignUpResponse {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
  error?: {
    code: string;
    message: string;
  };
}

// Enhanced sign-up function that sends role in multiple places to ensure compatibility
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
}): Promise<SignUpResponse> {
  try {
    const response = await fetch(`${API_URL}${API_BASE_PATH}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        email,
        password,
        callbackURL,
        role: role,
        emailVerified: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Sign up failed:", data);
      return {
        id: "",
        email: "",
        name: "",
        emailVerified: false,
        error: {
          code: data.code || "UNKNOWN_ERROR",
          message: data.message || "An unknown error occurred",
        },
      };
    }

    return data;
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      id: "",
      email: "",
      name: "",
      emailVerified: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Network or server error occurred",
      },
    };
  }
}
