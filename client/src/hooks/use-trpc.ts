import { queryClient, trpc } from "@/utils/trpc";

// Utility hook for property-related queries
export const useProperties = () => {
  // Get all properties
  const getAll = trpc.properties.getAll.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get property by ID
  const getById = (propertyId: string) =>
    trpc.properties.getById.useQuery({ id: propertyId });

  // Create property mutation
  const create = trpc.properties.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["properties", "getAll"]] });
    },
  });

  // Update property mutation
  const update = trpc.properties.update.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["properties", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["properties", "getById"], { id: data.id }],
      });
    },
  });

  // Delete property mutation
  const deleteProperty = trpc.properties.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["properties", "getAll"]] });
    },
  });

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteProperty,
  };
};

// Utility hook for tenant-related queries
export const useTenants = () => {
  // Get all tenants with optional filters
  const getAll = (filters?: {
    propertyId?: string;
    status?: "active" | "past" | "blacklisted";
    search?: string;
  }) => trpc.tenants.getAll.useQuery(filters || {});

  // Get tenant by ID
  const getById = (tenantId: string) =>
    trpc.tenants.getById.useQuery({ id: tenantId });

  // Create tenant mutation
  const create = trpc.tenants.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["tenants", "getAll"]] });
    },
  });

  // Update tenant mutation
  const update = trpc.tenants.update.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["tenants", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["tenants", "getById"], { id: data.id }],
      });
    },
  });

  // Delete tenant mutation
  const deleteTenant = trpc.tenants.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["tenants", "getAll"]] });
    },
  });

  // Get tenant statistics
  const getStats = trpc.tenants.getStats.useQuery(undefined, {
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteTenant,
    getStats,
  };
};

// Utility hook for lease-related queries
export const useLeases = () => {
  // Get all leases with optional filters
  const getAll = (filters?: {
    propertyId?: string;
    unitId?: string;
    tenantId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => trpc.leases.getAll.useQuery(filters || {});

  // Get lease by ID
  const getById = (leaseId: string, withTransactions = false) =>
    trpc.leases.getById.useQuery({ id: leaseId, withTransactions });

  // Create lease mutation
  const create = trpc.leases.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["leases", "getAll"]] });
    },
  });

  // Update lease mutation
  const update = trpc.leases.update.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["leases", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["leases", "getById"], { id: data.id }],
      });
    },
  });

  // Terminate lease mutation
  const terminate = trpc.leases.terminate.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["leases", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["leases", "getById"], { id: data.id }],
      });
    },
  });

  // Renew lease mutation
  const renew = trpc.leases.renew.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["leases", "getAll"]] });
    },
  });

  // Get lease statistics
  const getStats = (propertyId?: string) =>
    trpc.leases.getStats.useQuery({ propertyId });

  // Get expiring leases
  const getExpiringLeases = (daysAhead = 30) =>
    trpc.leases.getExpiringLeases.useQuery({ daysAhead });

  return {
    getAll,
    getById,
    create,
    update,
    terminate,
    renew,
    getStats,
    getExpiringLeases,
  };
};

// Utility hook for maintenance-related queries
export const useMaintenance = () => {
  // Get all maintenance requests with optional filters
  const getAll = (filters?: {
    propertyId?: string;
    unitId?: string;
    tenantId?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => trpc.maintenance.getAll.useQuery(filters || {});

  // Get maintenance request by ID
  const getById = (requestId: string) =>
    trpc.maintenance.getById.useQuery({ id: requestId });

  // Create maintenance request mutation
  const create = trpc.maintenance.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
    },
  });

  // Update maintenance request mutation
  const update = trpc.maintenance.update.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
    },
  });

  // Assign maintenance request mutation
  const assign = trpc.maintenance.assign.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
    },
  });

  // Resolve maintenance request mutation
  const resolve = trpc.maintenance.resolve.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
    },
  });

  // Add comment to maintenance request mutation
  const addComment = trpc.maintenance.addComment.useMutation({
    onSuccess: (_: any, variables: { requestId: any }) => {
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: variables.requestId }],
      });
    },
  });

  // Get maintenance statistics
  const getStats = (propertyId?: string) =>
    trpc.maintenance.getStats.useQuery({ propertyId });

  // Get maintenance categories
  const getCategories = trpc.maintenance.getCategories.useQuery();

  return {
    getAll,
    getById,
    create,
    update,
    assign,
    resolve,
    addComment,
    getStats,
    getCategories,
  };
};

// Utility hook for user-related queries
export const useUsers = () => {
  // Get user profile
  const getProfile = trpc.users.getProfile.useQuery();

  // Update user profile mutation
  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["users", "getProfile"]] });
    },
  });

  // Change password mutation
  const changePassword = trpc.users.changePassword.useMutation();

  return {
    getProfile,
    updateProfile,
    changePassword,
  };
};

// Utility hook for admin user management (for administrators only)
export const useUserManagement = () => {
  // Get all users with optional filters
  const getAll = (filters?: {
    role?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => trpc.users.getAll.useQuery(filters || {});

  // Get user by ID
  const getById = (userId: string) =>
    trpc.users.getById.useQuery({ id: userId });

  // Create user mutation
  const create = trpc.users.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["users", "getAll"]] });
    },
  });

  // Update user mutation
  const update = trpc.users.update.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["users", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["users", "getById"], { id: data.id }],
      });
    },
  });

  // Set user active status mutation
  const setActiveStatus = trpc.users.setActiveStatus.useMutation({
    onSuccess: (data: { id: any }) => {
      queryClient.invalidateQueries({ queryKey: [["users", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["users", "getById"], { id: data.id }],
      });
    },
  });

  // Delete user mutation
  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["users", "getAll"]] });
    },
  });

  // Get user statistics
  const getStats = trpc.users.getStats.useQuery();

  return {
    getAll,
    getById,
    create,
    update,
    setActiveStatus,
    delete: deleteUser,
    getStats,
  };
};
