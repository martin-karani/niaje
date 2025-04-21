import { create } from "zustand";
import {
  ASSIGN_TENANT_TO_LEASE,
  CREATE_TENANT,
  CREATE_TENANT_USER,
  DELETE_TENANT,
  GET_TENANT,
  GET_TENANTS,
  GET_TENANTS_BY_LEASE,
  GET_TENANTS_BY_STATUS,
  REMOVE_TENANT_FROM_LEASE,
  UPDATE_TENANT,
} from "../graphql/tenants";
import { apolloClient } from "../services/api";

// Tenant related types
export interface Tenant {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: "active" | "prospect" | "past" | "rejected" | "blacklisted";
  dateOfBirth?: string;
  occupation?: string;
  employer?: string;
  income?: number;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  expectedMoveInDate?: string;
  actualMoveInDate?: string;
  expectedMoveOutDate?: string;
  actualMoveOutDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  leases?: LeaseSummary[];
}

export interface LeaseSummary {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  unit?: {
    id: string;
    name: string;
    property?: {
      id: string;
      name: string;
    };
  };
}

export interface LeaseTenant {
  id: string;
  leaseId: string;
  tenantId: string;
  isPrimary: boolean;
  createdAt: string;
  lease?: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateTenantInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status?: string;
  dateOfBirth?: string;
  occupation?: string;
  employer?: string;
  income?: number;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  expectedMoveInDate?: string;
  actualMoveInDate?: string;
  expectedMoveOutDate?: string;
  actualMoveOutDate?: string;
  notes?: string;
}

export interface UpdateTenantInput {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  dateOfBirth?: string;
  occupation?: string;
  employer?: string;
  income?: number;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  expectedMoveInDate?: string;
  actualMoveInDate?: string;
  expectedMoveOutDate?: string;
  actualMoveOutDate?: string;
  notes?: string;
}

export interface CreateTenantUserInput {
  email: string;
  name: string;
  phone?: string;
  tenantId: string;
  password?: string;
  sendCredentials?: boolean;
}

export interface AssignTenantToLeaseInput {
  leaseId: string;
  tenantId: string;
  isPrimary?: boolean;
}

// Tenants store interface
interface TenantsState {
  tenants: Tenant[];
  tenant: Tenant | null;
  filteredTenants: Tenant[];
  isLoading: boolean;
  error: string | null;

  // Fetch data actions
  fetchTenants: () => Promise<Tenant[]>;
  fetchTenant: (id: string) => Promise<Tenant | null>;
  fetchTenantsByStatus: (status: string) => Promise<Tenant[]>;
  fetchTenantsByLease: (leaseId: string) => Promise<Tenant[]>;

  // Mutation actions
  createTenant: (data: CreateTenantInput) => Promise<Tenant>;
  updateTenant: (data: UpdateTenantInput) => Promise<Tenant>;
  deleteTenant: (id: string) => Promise<boolean>;
  assignTenantToLease: (data: AssignTenantToLeaseInput) => Promise<LeaseTenant>;
  removeTenantFromLease: (
    leaseId: string,
    tenantId: string
  ) => Promise<boolean>;
  createTenantUser: (data: CreateTenantUserInput) => Promise<any>;

  // Filter actions
  filterTenantsByStatus: (status: string | null) => void;
  filterTenantsBySearch: (searchTerm: string) => void;
  resetFilters: () => void;

  // Clear state
  clearTenant: () => void;
  clearError: () => void;
}

// Create the tenants store
export const useTenantsStore = create<TenantsState>((set, get) => ({
  tenants: [],
  tenant: null,
  filteredTenants: [],
  isLoading: false,
  error: null,

  // Fetch all tenants
  fetchTenants: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_TENANTS,
        fetchPolicy: "network-only",
      });

      const tenants = data.tenants;
      set({ tenants, filteredTenants: tenants, isLoading: false });
      return tenants;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch a single tenant
  fetchTenant: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_TENANT,
        variables: { id },
        fetchPolicy: "network-only",
      });

      const tenant = data.tenant;
      set({ tenant, isLoading: false });
      return tenant;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch tenants by status
  fetchTenantsByStatus: async (status: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_TENANTS_BY_STATUS,
        variables: { status },
        fetchPolicy: "network-only",
      });

      const tenants = data.tenantsByStatus;
      set({ filteredTenants: tenants, isLoading: false });
      return tenants;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch tenants by lease
  fetchTenantsByLease: async (leaseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.query({
        query: GET_TENANTS_BY_LEASE,
        variables: { leaseId },
        fetchPolicy: "network-only",
      });

      const tenants = data.tenantsByLease;
      set({ filteredTenants: tenants, isLoading: false });
      return tenants;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Create a new tenant
  createTenant: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: CREATE_TENANT,
        variables: { data },
      });

      const newTenant = response.createTenant;
      set((state) => ({
        tenants: [...state.tenants, newTenant],
        filteredTenants: [...state.filteredTenants, newTenant],
        isLoading: false,
      }));

      return newTenant;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update a tenant
  updateTenant: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: UPDATE_TENANT,
        variables: { data },
      });

      const updatedTenant = response.updateTenant;
      set((state) => ({
        tenants: state.tenants.map((tenant) =>
          tenant.id === data.id ? updatedTenant : tenant
        ),
        filteredTenants: state.filteredTenants.map((tenant) =>
          tenant.id === data.id ? updatedTenant : tenant
        ),
        tenant: updatedTenant,
        isLoading: false,
      }));

      return updatedTenant;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Delete a tenant
  deleteTenant: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_TENANT,
        variables: { id },
      });

      if (data.deleteTenant) {
        set((state) => ({
          tenants: state.tenants.filter((tenant) => tenant.id !== id),
          filteredTenants: state.filteredTenants.filter(
            (tenant) => tenant.id !== id
          ),
          tenant: state.tenant?.id === id ? null : state.tenant,
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

  // Assign tenant to lease
  assignTenantToLease: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: ASSIGN_TENANT_TO_LEASE,
        variables: { data },
      });

      const result = response.assignTenantToLease;
      set({ isLoading: false });

      // If we have the current tenant loaded, update its leases
      if (get().tenant && get().tenant.id === data.tenantId) {
        const tenant = get().tenant;
        const lease = result.lease;

        if (tenant && lease) {
          const updatedTenant = {
            ...tenant,
            leases: [
              ...(tenant.leases || []),
              {
                id: lease.id,
                startDate: lease.startDate,
                endDate: lease.endDate,
                status: lease.status,
              },
            ],
          };

          set({ tenant: updatedTenant });
        }
      }

      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Remove tenant from lease
  removeTenantFromLease: async (leaseId: string, tenantId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apolloClient.mutate({
        mutation: REMOVE_TENANT_FROM_LEASE,
        variables: { leaseId, tenantId },
      });

      if (data.removeTenantFromLease) {
        // If we have the current tenant loaded, update its leases
        if (get().tenant && get().tenant.id === tenantId) {
          const tenant = get().tenant;

          if (tenant && tenant.leases) {
            const updatedTenant = {
              ...tenant,
              leases: tenant.leases.filter((lease) => lease.id !== leaseId),
            };

            set({ tenant: updatedTenant });
          }
        }

        set({ isLoading: false });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Create tenant user for portal access
  createTenantUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await apolloClient.mutate({
        mutation: CREATE_TENANT_USER,
        variables: { data },
      });

      const result = response.createTenantUser;
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Filter tenants by status
  filterTenantsByStatus: (status: string | null) => {
    if (!status) {
      set((state) => ({ filteredTenants: state.tenants }));
      return;
    }

    set((state) => ({
      filteredTenants: state.tenants.filter(
        (tenant) => tenant.status === status
      ),
    }));
  },

  // Filter tenants by search term
  filterTenantsBySearch: (searchTerm: string) => {
    if (!searchTerm) {
      set((state) => ({ filteredTenants: state.tenants }));
      return;
    }

    const term = searchTerm.toLowerCase();
    set((state) => ({
      filteredTenants: state.tenants.filter(
        (tenant) =>
          tenant.firstName.toLowerCase().includes(term) ||
          tenant.lastName.toLowerCase().includes(term) ||
          tenant.email.toLowerCase().includes(term) ||
          (tenant.phone && tenant.phone.includes(term))
      ),
    }));
  },

  // Reset all filters
  resetFilters: () => {
    set((state) => ({ filteredTenants: state.tenants }));
  },

  // Clear tenant
  clearTenant: () => set({ tenant: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));
