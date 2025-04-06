// Placeholder types that match the backend's TRPC router structure
// In production, you might want to generate these from the backend or create a shared types package

export interface User {
  id: string;
  email: string;
  name: string;
  role: "LANDLORD" | "CARETAKER" | "AGENT" | "ADMIN";
  emailVerified: boolean;
  image?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  caretakerId?: string;
  agentId?: string;
  owner?: User;
  caretaker?: User;
  agent?: User;
}

// This type should match your backend TRPC router structure
export interface AppRouter {
  users: {
    me: {
      input: void;
      output: User;
    };
    getAll: {
      input: void;
      output: User[];
    };
    getById: {
      input: { id: string };
      output: User;
    };
    updateProfile: {
      input: {
        name?: string;
        phone?: string;
        image?: string;
        address?: string;
        city?: string;
        country?: string;
        bio?: string;
      };
      output: { success: boolean; user: User };
    };
    canLandlordAccessUser: {
      input: { userId: string };
      output: boolean;
    };
  };
  properties: {
    getAll: {
      input: void;
      output: Property[];
    };
    getById: {
      input: { id: string };
      output: Property;
    };
    create: {
      input: {
        name: string;
        address: string;
        type: string;
        description?: string;
        caretakerId?: string;
        agentId?: string;
      };
      output: Property;
    };
    update: {
      input: {
        id: string;
        name?: string;
        address?: string;
        type?: string;
        description?: string;
        caretakerId?: string;
        agentId?: string;
      };
      output: Property;
    };
    delete: {
      input: { id: string };
      output: { success: boolean };
    };
  };
}
