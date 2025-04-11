export interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  description: string | null;
  ownerId: string;
  caretakerId: string | null;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyWithRelations extends Property {
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  caretaker?: {
    id: string;
    name: string;
    email: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  rent: number;
  depositAmount: number;
  status: string;
  features: any;
  images: any;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
