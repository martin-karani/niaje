import { queryClient, RouterInputs, trpc } from "@/utils/trpc";

// Utility hook for maintenance-related queries
export const useMaintenance = () => {
  // Get all maintenance requests with optional filters
  const getAll = (filters?: RouterInputs["maintenance"]["getAll"]) => {
    return trpc.maintenance.getAll.useQuery(filters || {});
  };

  // Get maintenance request by ID
  const getById = (requestId: string) => {
    return trpc.maintenance.getById.useQuery({ id: requestId });
  };

  // Create maintenance request mutation
  const create = trpc.maintenance.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
    },
  });

  // Update maintenance request mutation
  const update = trpc.maintenance.update.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
    },
  });

  // Assign maintenance request mutation
  const assign = trpc.maintenance.assign.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
    },
  });

  // Resolve maintenance request mutation
  const resolve = trpc.maintenance.resolve.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
    },
  });

  // Add comment to maintenance request mutation
  const addComment = trpc.maintenance.addComment.useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: variables.requestId }],
      });
    },
  });

  // Get maintenance statistics
  const getStats = (propertyId: string) => {
    return trpc.maintenance.getStats.useQuery({ propertyId });
  };

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
