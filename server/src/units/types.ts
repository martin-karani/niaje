// Types for units domain

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  size: number | null;
  rent: number;
  depositAmount: number;
  status: string; // vacant, occupied, maintenance, reserved, unavailable
  features: any | null; // JSON data for features like air conditioning, furnished, etc.
  images: any | null; // JSON array of image URLs
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitWithRelations extends Unit {
  property?: {
    id: string;
    name: string;
    address: string;
    ownerId: string;
  };
  activeLeases?: {
    id: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    tenantName?: string;
  }[];
  maintenanceRequests?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    reportedAt: Date;
  }[];
}

export interface UnitStats {
  totalUnits: number;
  vacantUnits: number;
  occupiedUnits: number;
  maintenanceUnits: number;
  reservedUnits: number;
  unavailableUnits: number;
  averageRent: number;
  occupancyRate: number; // percentage of units occupied
  unitsByBedrooms: {
    bedrooms: number;
    count: number;
  }[];
  unitsByRentRange: {
    range: string; // e.g., "0-500", "501-1000", etc.
    count: number;
  }[];
}
