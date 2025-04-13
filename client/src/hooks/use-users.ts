import { queryClient, RouterInputs, trpc } from "@/utils/trpc";

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
  const getAll = (filters?: RouterInputs["users"]["getAll"]) => {
    return trpc.users.getAll.useQuery(filters || {});
  };

  // Get user by ID
  const getById = (userId: string) => {
    return trpc.users.getById.useQuery({ id: userId });
  };

  // Create user mutation
  const create = trpc.users.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["users", "getAll"]] });
    },
  });

  // Update user mutation
  const update = trpc.users.update.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["users", "getAll"]] });
      queryClient.invalidateQueries({
        queryKey: [["users", "getById"], { id: data.id }],
      });
    },
  });

  // Set user active status mutation
  const setActiveStatus = trpc.users.setActiveStatus.useMutation({
    onSuccess: (data) => {
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
