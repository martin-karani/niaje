import { queryClient, RouterInputs, trpc } from "@/utils/trpc";

export const useTenants = () => {
  // Get all tenants with optional filters
  const getAll = (filters?: RouterInputs["tenants"]["getAll"]) => {
    return trpc.tenants.getAll.useQuery(filters || {});
  };

  // Get tenant by ID
  const getById = (tenantId: string) => {
    return trpc.tenants.getById.useQuery({ id: tenantId });
  };

  // Create tenant mutation
  const create = trpc.tenants.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["tenants", "getAll"]] });
    },
  });

  // Update tenant mutation
  const update = trpc.tenants.update.useMutation({
    onSuccess: (data) => {
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
  const getStats = (propertyId?: string) => {
    return trpc.tenants.getStats.useQuery(
      { propertyId: propertyId || "" },
      {
        // Only run query if propertyId is provided
        enabled: !!propertyId,
      }
    );
  };

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteTenant,
    getStats,
  };
};
