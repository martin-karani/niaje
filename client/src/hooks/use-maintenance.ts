import { queryClient, RouterInputs, trpc } from "@/utils/trpc";

// Utility hook for maintenance-related queries
export const useMaintenance = () => {
  // Get all maintenance requests with optional filters
  const getAll = (filters?: RouterInputs["maintenance"]["getAll"]) => {
    return trpc.maintenance.getAll.useQuery(filters || {}, {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: true, // Refetch when window regains focus
      select: (data) => ({
        requests: data.requests,
        total: data.total,
        pages: data.pages,
      }),
    });
  };

  // Get maintenance request by ID
  const getById = (requestId?: string) => {
    return trpc.maintenance.getById.useQuery(
      { id: requestId || "" },
      {
        enabled: !!requestId, // Only run query if requestId is provided
        staleTime: 2 * 60 * 1000, // 2 minutes cache
      }
    );
  };

  // Create maintenance request mutation
  const create = trpc.maintenance.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      // Show success toast
      // toast.success("Maintenance request created successfully");
    },
  });

  // Update maintenance request mutation
  const update = trpc.maintenance.update.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
      // Show success toast
      // toast.success("Maintenance request updated successfully");
    },
  });

  // Assign maintenance request mutation
  const assign = trpc.maintenance.assign.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
      // Show success toast
      // toast.success("Maintenance request assigned successfully");
    },
  });

  // Resolve maintenance request mutation
  const resolve = trpc.maintenance.resolve.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: data.id }],
      });
      // Show success toast
      // toast.success("Maintenance request resolved successfully");
    },
  });

  // Add comment to maintenance request mutation
  const addComment = trpc.maintenance.addComment.useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [["maintenance", "getById"], { id: variables.requestId }],
      });
      // Optionally also invalidate the getAll query to reflect comment count changes
      queryClient.invalidateQueries({ queryKey: [["maintenance", "getAll"]] });
      // Show success toast
      // toast.success("Comment added successfully");
    },
  });

  // Get maintenance statistics
  const getStats = (propertyId?: string) => {
    return trpc.maintenance.getStats.useQuery(
      { propertyId: propertyId || "" },
      {
        enabled: !!propertyId, // Only run if propertyId is provided
        staleTime: 15 * 60 * 1000, // 15 minutes cache for stats
      }
    );
  };

  // Get maintenance categories
  const getCategories = () => {
    return trpc.maintenance.getCategories.useQuery(undefined, {
      staleTime: 60 * 60 * 1000, // 1 hour cache for categories
    });
  };

  // Get maintenance requests for a specific property
  const getByProperty = (propertyId?: string) => {
    return trpc.maintenance.getAll.useQuery(
      { propertyId },
      {
        enabled: !!propertyId,
        staleTime: 5 * 60 * 1000,
      }
    );
  };

  // Get maintenance requests for a specific unit
  const getByUnit = (unitId?: string) => {
    return trpc.maintenance.getAll.useQuery(
      { unitId },
      {
        enabled: !!unitId,
        staleTime: 5 * 60 * 1000,
      }
    );
  };

  // Get pending maintenance requests count (for notifications)
  const getPendingCount = (propertyId?: string) => {
    return trpc.maintenance.getAll.useQuery(
      {
        propertyId,
        status: "open",
        limit: 1, // We only need the count, not the actual data
      },
      {
        select: (data) => data.total,
        staleTime: 5 * 60 * 1000,
      }
    );
  };

  // Generate maintenance report
  const generateReport = trpc.maintenance.generateReport.useMutation();

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
    getByProperty,
    getByUnit,
    getPendingCount,
    generateReport,
  };
};
