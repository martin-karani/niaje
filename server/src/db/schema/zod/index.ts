import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  users,
  properties,
  accounts,
  sessions,
  verifications,
  userRoleEnum,
} from "../index";

type Enum<T extends Record<string, string>> = T[keyof T];

// Type for user roles from the schema
type UserRole = (typeof userRoleEnum.enumValues)[number];

// Users schemas
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email("Invalid email address"),
  name: (schema) => schema.name.min(2, "Name must be at least 2 characters"),
  role: z.enum(["LANDLORD", "CARETAKER", "AGENT", "ADMIN"] as const),
  phone: (schema) => schema.phone.nullish(),
  address: (schema) => schema.address.nullish(),
  city: (schema) => schema.city.nullish(),
  country: (schema) => schema.country.nullish(),
  bio: (schema) => schema.bio.nullish(),
});

export const selectUserSchema = createSelectSchema(users);
export const userIdSchema = selectUserSchema.pick({ id: true });

export const updateUserSchema = insertUserSchema
  .omit({ id: true })
  .partial()
  .merge(userIdSchema);

export const userProfileSchema = insertUserSchema
  .omit({
    id: true,
    email: true,
    role: true,
    emailVerified: true,
    isActive: true,
  })
  .partial();

// Properties schemas
export const insertPropertySchema = createInsertSchema(properties, {
  name: (schema) => schema.name.min(2, "Name must be at least 2 characters"),
  address: (schema) =>
    schema.address.min(5, "Address must be at least 5 characters"),
  type: (schema) => schema.type.min(2, "Type must be at least 2 characters"),
  description: (schema) => schema.description.nullish(),
  caretakerId: (schema) => schema.caretakerId.nullish(),
  agentId: (schema) => schema.agentId.nullish(),
});

export const selectPropertySchema = createSelectSchema(properties);
export const propertyIdSchema = selectPropertySchema.pick({ id: true });

export const updatePropertySchema = insertPropertySchema
  .omit({ id: true, ownerId: true })
  .partial()
  .merge(propertyIdSchema);

// Accounts schemas
export const insertAccountSchema = createInsertSchema(accounts, {
  password: (schema) => schema.password.optional(),
});

export const selectAccountSchema = createSelectSchema(accounts);

// Sessions schemas
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

// Verifications schemas
export const insertVerificationSchema = createInsertSchema(verifications);
export const selectVerificationSchema = createSelectSchema(verifications);

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z
    .enum(["LANDLORD", "CARETAKER", "AGENT", "ADMIN"] as const)
    .default("LANDLORD"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});
