import { queryClient, trpc } from "@/utils/trpc";

// Utility hook for property-related queries
export const useProperties = () => {
  // Get all properties
  const getAll = () => {
    return trpc.properties.getAll.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Get property by ID
  const getById = (propertyId: string) => {
    return trpc.properties.getById.useQuery({ id: propertyId });
  };

  // Create property mutation
  const create = trpc.properties.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["properties", "getAll"]] });
    },
  });

  // Update property mutation
  const update = trpc.properties.update.useMutation({
    onSuccess: (data) => {
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
