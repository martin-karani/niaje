import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { trpc } from "./trpc";

/**
 * Custom hooks for common tRPC queries with proper error handling
 * and loading states. These hooks abstract away some of the complexity
 * of handling TRPC queries and mutations.
 */

// Hook for fetching all properties with error handling
export const useProperties = () => {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = trpc.properties.getAll.useQuery(undefined, {
    enabled: !!user,
    onError: (error) => {
      console.error("Error fetching properties:", error);
      setErrorMessage(error.message || "Failed to load properties");
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    properties: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: errorMessage,
    refetch: query.refetch,
  };
};

// Hook for fetching a single property with error handling
export const useProperty = (propertyId: string) => {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = trpc.properties.getById.useQuery(
    { id: propertyId },
    {
      enabled: !!user && !!propertyId,
      onError: (error) => {
        console.error(`Error fetching property ${propertyId}:`, error);
        setErrorMessage(error.message || "Failed to load property details");
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  return {
    property: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: errorMessage,
    refetch: query.refetch,
  };
};

// Hook for creating a property
export const useCreateProperty = () => {
  const utils = trpc.useContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      // Invalidate the properties query cache to trigger a refetch
      utils.properties.getAll.invalidate();
      setSuccessMessage("Property created successfully");
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error("Error creating property:", error);
      setErrorMessage(error.message || "Failed to create property");
      setSuccessMessage(null);
    },
  });

  // Clear messages when component unmounts or when mutation is reset
  useEffect(() => {
    return () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    };
  }, [mutation.isIdle]);

  return {
    createProperty: mutation.mutate,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: errorMessage,
    successMessage,
    reset: () => {
      mutation.reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    },
  };
};

// Hook for updating a property
export const useUpdateProperty = () => {
  const utils = trpc.useContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = trpc.properties.update.useMutation({
    onSuccess: (data) => {
      // Invalidate both the list and the specific property query
      utils.properties.getAll.invalidate();
      if (data?.id) {
        utils.properties.getById.invalidate({ id: data.id });
      }
      setSuccessMessage("Property updated successfully");
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error("Error updating property:", error);
      setErrorMessage(error.message || "Failed to update property");
      setSuccessMessage(null);
    },
  });

  useEffect(() => {
    return () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    };
  }, [mutation.isIdle]);

  return {
    updateProperty: mutation.mutate,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: errorMessage,
    successMessage,
    reset: () => {
      mutation.reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    },
  };
};

// Hook for deleting a property
export const useDeleteProperty = () => {
  const utils = trpc.useContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      // Invalidate the properties query cache to trigger a refetch
      utils.properties.getAll.invalidate();
      setSuccessMessage("Property deleted successfully");
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error("Error deleting property:", error);
      setErrorMessage(error.message || "Failed to delete property");
      setSuccessMessage(null);
    },
  });

  useEffect(() => {
    return () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    };
  }, [mutation.isIdle]);

  return {
    deleteProperty: mutation.mutate,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: errorMessage,
    successMessage,
    reset: () => {
      mutation.reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    },
  };
};

// Hook for fetching user profile
export const useUserProfile = () => {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = trpc.users.me.useQuery(undefined, {
    enabled: !!user,
    onError: (error) => {
      console.error("Error fetching user profile:", error);
      setErrorMessage(error.message || "Failed to load user profile");
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: errorMessage,
    refetch: query.refetch,
  };
};

// Hook for updating user profile
export const useUpdateProfile = () => {
  const utils = trpc.useContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      // Invalidate the user profile query cache to trigger a refetch
      utils.users.me.invalidate();
      setSuccessMessage("Profile updated successfully");
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      setErrorMessage(error.message || "Failed to update profile");
      setSuccessMessage(null);
    },
  });

  useEffect(() => {
    return () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    };
  }, [mutation.isIdle]);

  return {
    updateProfile: mutation.mutate,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: errorMessage,
    successMessage,
    reset: () => {
      mutation.reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    },
  };
};
