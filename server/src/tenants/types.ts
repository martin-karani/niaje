export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  dateOfBirth: Date | null;
  status: string; // active, past, blacklisted
  documents: any | null; // JSON document references
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantWithRelations extends Tenant {
  leases?: {
    id: string;
    unitId: string;
    startDate: Date;
    endDate: Date;
    status: string;
    unit?: {
      name: string;
      property?: {
        id: string;
        name: string;
      };
    };
  }[];
  maintenanceRequests?: {
    id: string;
    title: string;
    status: string;
    unit?: {
      name: string;
      property?: {
        id: string;
        name: string;
      };
    };
  }[];
}

export interface TenantDocument {
  id: string;
  name: string;
  url: string;
  type: string; // id_card, lease_agreement, etc.
  uploadedAt: Date;
}
