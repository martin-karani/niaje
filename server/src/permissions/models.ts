export type Permission =
  // Property permissions
  | "properties:view"
  | "properties:manage"
  // Tenant permissions
  | "tenants:view"
  | "tenants:manage"
  // Lease permissions
  | "leases:view"
  | "leases:manage"
  // Payment permissions
  | "payments:view"
  | "payments:collect"
  // Maintenance permissions
  | "maintenance:view"
  | "maintenance:manage"
  // Report permissions
  | "reports:view"
  // System permissions
  | "users:manage"
  | "roles:manage";

// Map roles to default permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    // System permissions
    "users:manage",
    "roles:manage",
    // All other permissions
    "properties:view",
    "properties:manage",
    "tenants:view",
    "tenants:manage",
    "leases:view",
    "leases:manage",
    "payments:view",
    "payments:collect",
    "maintenance:view",
    "maintenance:manage",
    "reports:view",
  ],
  LANDLORD: [
    "properties:view",
    "properties:manage",
    "tenants:view",
    "tenants:manage",
    "leases:view",
    "leases:manage",
    "payments:view",
    "payments:collect",
    "maintenance:view",
    "maintenance:manage",
    "reports:view",
  ],
  CARETAKER: [
    "properties:view",
    "tenants:view",
    "tenants:manage",
    "payments:collect",
    "maintenance:view",
    "maintenance:manage",
  ],
  AGENT: [
    "properties:view",
    "tenants:view",
    "tenants:manage",
    "leases:view",
    "leases:manage",
  ],
};

// Define property-specific permission interface
export interface PropertyPermission {
  propertyId: string;
  permissions: Permission[];
}
