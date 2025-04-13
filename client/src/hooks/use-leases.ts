import { queryClient, RouterInputs, trpc } from "@/utils/trpc";

// Utility hook for lease-related queries
export const useLeases = () => {
  // Get all leases with optional filters
  const getAll = (filters?: RouterInputs["leases"]["getAll"]) => {
    return trpc.leases.getAll.useQuery(filters || {});
  };

  // Get lease by ID
  const getById = (leaseId: string, withTransactions = false) => {
    return trpc.leases.getById.useQuery({ id: leaseId, withTransactions });
  };

  // Create lease mutation
  const create = trpc.leases.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["leases", "getAll"]] });
    },
  });

  // Update lease mutation
  const update = trpc.leases.update.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["leases", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["leases", "getById"], { id: data.id }],
      });
    },
  });

  // Terminate lease mutation
  const terminate = trpc.leases.terminate.useMutation({
    onSuccess: (data) => {
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
  const getStats = (propertyId: string) => {
    return trpc.leases.getStats.useQuery({ propertyId });
  };

  // Get expiring leases
  const getExpiringLeases = (daysAhead: number) => {
    return trpc.leases.getExpiringLeases.useQuery({ daysAhead });
  };

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
