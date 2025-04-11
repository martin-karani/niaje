// Types for maintenance domain

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId: string | null;
  title: string;
  description: string;
  priority: string; // low, medium, high, emergency
  status: string; // open, in_progress, completed, closed
  reportedAt: Date;
  assignedTo: string | null;
  resolvedAt: Date | null;
  cost: number | null;
  images: any | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRequestWithRelations extends MaintenanceRequest {
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  unit?: {
    id: string;
    name: string;
    property?: {
      id: string;
      name: string;
      address: string;
    };
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  comments?: MaintenanceComment[];
}

export interface MaintenanceComment {
  id: string;
  requestId: string;
  userId: string;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface MaintenanceStats {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  requestsByPriority: {
    priority: string;
    count: number;
  }[];
  requestsByStatus: {
    status: string;
    count: number;
  }[];
  avgResolutionTime: number; // in days
  totalMaintenanceCost: number;
}

export interface MaintenanceCategory {
  id: string;
  name: string;
  description: string | null;
  isCommon: boolean;
}
