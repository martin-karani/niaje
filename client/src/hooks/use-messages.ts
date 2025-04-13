import { queryClient, RouterInputs, trpc } from "@/utils/trpc";

// Utility hook for messaging-related queries
export const useMessaging = () => {
  // Get all messages with optional filters
  const getMessages = (filters?: RouterInputs["messaging"]["getAll"]) => {
    return trpc.messaging.getAll.useQuery(filters || {}, {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
  };

  // Get message by ID
  const getMessageById = (messageId: string) => {
    return trpc.messaging.getById.useQuery({ id: messageId });
  };

  // Send a message mutation
  const sendMessage = trpc.messaging.send.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["messaging", "getAll"]] });
      // toast.success("Message sent successfully");
    },
  });

  // Delete a message mutation
  const deleteMessage = trpc.messaging.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["messaging", "getAll"]] });
      // toast.success("Message deleted successfully");
    },
  });

  // Create a message template mutation
  const createTemplate = trpc.messaging.createTemplate.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["messaging", "getTemplates"]],
      });
      // toast.success("Template created successfully");
    },
  });

  // Get all message templates
  const getTemplates = () => {
    return trpc.messaging.getTemplates.useQuery();
  };

  // Update a message template mutation
  const updateTemplate = trpc.messaging.updateTemplate.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["messaging", "getTemplates"]],
      });
      // toast.success("Template updated successfully");
    },
  });

  // Delete a message template mutation
  const deleteTemplate = trpc.messaging.deleteTemplate.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["messaging", "getTemplates"]],
      });
      // toast.success("Template deleted successfully");
    },
  });

  return {
    getMessages,
    getMessageById,
    sendMessage,
    deleteMessage,
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate,
  };
};
