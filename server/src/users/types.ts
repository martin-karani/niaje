// Types for users domain

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  image: string | null;
  phone: string | null;
  isActive: boolean;
  address: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithProperties extends UserProfile {
  ownedProperties?: {
    id: string;
    name: string;
    address: string;
    type: string;
  }[];
  managedProperties?: {
    id: string;
    name: string;
    address: string;
    type: string;
  }[];
  representedProperties?: {
    id: string;
    name: string;
    address: string;
    type: string;
  }[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: {
    role: string;
    count: number;
  }[];
  recentlyCreated: number; // Last 30 days
}

// Role-specific functionality
export interface RolePermissions {
  role: string;
  permissions: {
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManageProperties: boolean;
    canManageTenants: boolean;
    canManageLeases: boolean;
    canManagePayments: boolean;
    canViewReports: boolean;
    canManageMaintenance: boolean;
  };
}
