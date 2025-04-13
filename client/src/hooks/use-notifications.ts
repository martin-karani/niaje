import { queryClient, trpc, type RouterInputs } from "@/utils/trpc";

// Utility hook for notification-related queries
export const useNotifications = () => {
  // Get all notifications with optional filters
  const getAll = (filters?: RouterInputs["notifications"]["getAll"]) => {
    return trpc.notifications.getAll.useQuery(filters || {});
  };

  // Get notification by ID
  const getById = (notificationId: string) => {
    return trpc.notifications.getById.useQuery({ id: notificationId });
  };

  // Mark notification as read
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getAll"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getSummary"]],
      });
    },
  });

  // Mark multiple notifications as read
  const markMultipleAsRead = trpc.notifications.markMultipleAsRead.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getAll"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getSummary"]],
      });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getAll"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getSummary"]],
      });
    },
  });

  // Delete notification
  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getAll"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getSummary"]],
      });
    },
  });

  // Delete all notifications
  const deleteAll = trpc.notifications.deleteAll.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getAll"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["notifications", "getSummary"]],
      });
    },
  });

  // Get notification summary (unread counts, etc.)
  const getSummary = trpc.notifications.getSummary.useQuery(undefined, {
    // Refresh every minute
    refetchInterval: 60 * 1000,
  });

  return {
    getAll,
    getById,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    getSummary,
  };
};
