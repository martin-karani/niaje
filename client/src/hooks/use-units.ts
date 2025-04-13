import { queryClient, trpc, type RouterInputs } from "@/utils/trpc";

// Utility hook for unit-related queries
export const useUnits = () => {
  // Get all units with optional filters
  const getAll = (filters?: RouterInputs["units"]["getAll"]) => {
    return trpc.units.getAll.useQuery(filters || {});
  };

  // Get unit by ID
  const getById = (unitId: string) => {
    return trpc.units.getById.useQuery({ id: unitId });
  };

  // Create unit mutation
  const create = trpc.units.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["units", "getAll"]] });
    },
  });

  // Update unit mutation
  const update = trpc.units.update.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["units", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["units", "getById"], { id: data.id }],
      });
    },
  });

  // Delete unit mutation
  const deleteUnit = trpc.units.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["units", "getAll"]] });
    },
  });

  // Update unit status
  const updateStatus = trpc.units.updateStatus.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["units", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["units", "getById"], { id: data.id }],
      });
    },
  });

  // Get unit statistics
  const getStats = (propertyId?: string) => {
    return trpc.units.getStats.useQuery({ propertyId });
  };

  // Get vacant units for a property
  const getVacantUnits = (propertyId: string) => {
    return trpc.units.getVacantUnits.useQuery({ propertyId });
  };

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteUnit,
    updateStatus,
    getStats,
    getVacantUnits,
  };
};
