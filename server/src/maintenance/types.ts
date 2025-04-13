// Types for maintenance domain

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId: string | null;
  title: string;
  description: string;
  priority: string; // low, medium, high, emergency
  status: string; // open, in_progress, completed, closed, cancelled, processed
  reportedAt: Date;
  assignedTo: string | null;
  workOrderId: string | null; // Reference to work order created from this request
  resolvedAt: Date | null;
  cost: number | null;
  images: any | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id: string;
  requestId: string | null; // Reference to maintenance request this was created from
  title: string;
  description: string;
  priority: string; // normal, high, urgent
  status: string; // pending, assigned, in_progress, completed, canceled
  unitId: string;
  tenantId: string | null;
  assignedTo: string | null; // Internal assignee (user in the system)
  assignedToName: string | null; // Name of external assignee
  assignedToPhone: string | null; // Phone of external assignee
  assignedToEmail: string | null; // Email of external assignee
  reportedAt: Date;
  resolvedAt: Date | null;
  category: string | null;
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
  workOrder?: WorkOrder; // The related work order
}

export interface WorkOrderWithRelations extends WorkOrder {
  maintenanceRequest?: MaintenanceRequest;
  unit?: {
    id: string;
    name: string;
    property?: {
      id: string;
      name: string;
      address: string;
    };
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
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

export interface Activity {
  id: string;
  userId: string;
  action: string; // changed_status, created_work_order, etc.
  entityType: string; // maintenance_request, work_order
  entityId: string;
  unitId?: string;
  previousStatus?: string;
  newStatus?: string;
  metadata?: any;
  createdAt: Date;
}

export interface ActivityWithRelations extends Activity {
  user?: {
    id: string;
    name: string;
    role: string;
    image?: string;
  };
  unit?: {
    id: string;
    name: string;
    property?: {
      id: string;
      name: string;
    };
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
