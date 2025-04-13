import { queryClient, trpc } from "@/utils/trpc";

// Utility hook for managing activities
export const useActivities = () => {
  // Get all activities
  const getAll = () => {
    return trpc.activities.getAll.useQuery();
  };

  // Clear a specific activity
  const clearActivity = trpc.activities.clear.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["activities", "getAll"]] });
    },
  });

  // Clear all activities
  const clearAll = trpc.activities.clearAll.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["activities", "getAll"]] });
    },
  });

  return {
    getAll,
    clearActivity,
    clearAll,
  };
};
