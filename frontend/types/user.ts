export type UserRole = "LANDLORD" | "CARETAKER" | "AGENT" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
  emailVerified?: boolean;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}
