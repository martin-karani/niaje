import { create } from "zustand";
import {
  CREATE_PROPERTY,
  CREATE_UNIT,
  DELETE_PROPERTY,
  DELETE_UNIT,
  GET_PROPERTIES,
  GET_PROPERTY,
  UPDATE_PROPERTY,
  UPDATE_UNIT,
} from "../graphql/properties";
import { apolloClient } from "../services/api";

// Property related types
export interface Property {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  type: string;
  status: string;
  description?: string;
  yearBuilt?: number;
  numberOfUnits: number;
  images?: string[];
  amenities?: string[];
  notes?: string;
  occupancyRate: number;
  createdAt: string;
  updatedAt: string;
  isInActiveTeam?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  propertyId: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqFt?: number;
  floor?: number;
  marketRent?: number;
  currentRent?: number;
  depositAmount?: number;
  features?: string[];
  images?: string[];
  notes?: string;
  property?: Property;
  createdAt: string;
  updatedAt: string;
}

// Properties store interface
interface PropertiesState {
  properties: Property[];
  property: Property | null;
  units: Unit[];
  unit: Unit | null;
  isLoading: boolean;
  error: string | null;

  // Fetch data actions
  fetchProperties: () => Promise<Property[]>;
  fetchProperty: (id: string) => Promise<Property | null>;
  fetchUnits: (propertyId: string) => Promise<Unit[]>;
  fetchUnit: (id: string) => Promise<Unit | null>;

  // Mutation actions
  createProperty: (
    data: Omit<Property, "id" | "createdAt" | "updatedAt" | "occupancyRate">
  ) => Promise<Property>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<boolean>;
  createUnit: (
    data: Omit<Unit, "id" | "createdAt" | "updatedAt">
  ) => Promise<Unit>;
  updateUnit: (id: string, data: Partial<Unit>) => Promise<Unit>;
  deleteUnit: (id: string) => Promise<boolean>;

  // Clear state
  clearProperty: () => void;
  clearUnit: () => void;
  clearError: () => void;
}

// Create the properties store
export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  property: null,
  units: [],
  unit: null,
  isLoading: false,
  error: null,

  // Fetch properties
  fetchProperties: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_PROPERTIES,
        fetchPolicy: "network-only",
      });

      const properties = data.properties;
      set({ properties, isLoading: false });
      return properties;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch a single property
  fetchProperty: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_PROPERTY,
        variables: { id },
        fetchPolicy: "network-only",
      });

      const property = data.property;
      set({ property, isLoading: false });
      return property;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch units for a property
  fetchUnits: async (propertyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_UNITS,
        variables: { propertyId },
        fetchPolicy: "network-only",
      });

      const units = data.units;
      set({ units, isLoading: false });
      return units;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch a single unit
  fetchUnit: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_UNIT,
        variables: { id },
        fetchPolicy: "network-only",
      });

      const unit = data.unit;
      set({ unit, isLoading: false });
      return unit;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Create a new property
  createProperty: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: CREATE_PROPERTY,
        variables: { data },
      });

      const newProperty = response.createProperty;
      set((state) => ({
        properties: [...state.properties, newProperty],
        isLoading: false,
      }));

      return newProperty;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update a property
  updateProperty: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: UPDATE_PROPERTY,
        variables: { id, data },
      });

      const updatedProperty = response.updateProperty;
      set((state) => ({
        properties: state.properties.map((property) =>
          property.id === id ? updatedProperty : property
        ),
        property: updatedProperty,
        isLoading: false,
      }));

      return updatedProperty;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Delete a property
  deleteProperty: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_PROPERTY,
        variables: { id },
      });

      if (data.deleteProperty) {
        set((state) => ({
          properties: state.properties.filter((property) => property.id !== id),
          property: state.property?.id === id ? null : state.property,
          isLoading: false,
        }));

        return true;
      }

      return false;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Create a new unit
  createUnit: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: CREATE_UNIT,
        variables: { data },
      });

      const newUnit = response.createUnit;
      set((state) => ({
        units: [...state.units, newUnit],
        isLoading: false,
      }));

      return newUnit;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update a unit
  updateUnit: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: UPDATE_UNIT,
        variables: { id, data },
      });

      const updatedUnit = response.updateUnit;
      set((state) => ({
        units: state.units.map((unit) => (unit.id === id ? updatedUnit : unit)),
        unit: updatedUnit,
        isLoading: false,
      }));

      return updatedUnit;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Delete a unit
  deleteUnit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_UNIT,
        variables: { id },
      });

      if (data.deleteUnit) {
        set((state) => ({
          units: state.units.filter((unit) => unit.id !== id),
          unit: state.unit?.id === id ? null : state.unit,
          isLoading: false,
        }));

        return true;
      }

      return false;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Clear property
  clearProperty: () => set({ property: null }),

  // Clear unit
  clearUnit: () => set({ unit: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));
