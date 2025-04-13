import { useAuth } from "@/providers/auth-provider";
import { trpc } from "@/utils/trpc";

export function useProperties() {
  const { properties, activeProperty, setActiveProperty } = useAuth();

  // Fetch properties from the server
  const { data, isLoading, error, refetch } =
    trpc.properties.getAll.useQuery(undefined);

  // Get property stats
  const getPropertyStats = (propertyId: string) => {
    return trpc.units.getStats.useQuery(
      { propertyId },
      {
        enabled: !!propertyId,
        staleTime: 1000 * 60 * 5, // 5 minutes
      }
    );
  };

  // Get lease stats for a property
  const getLeaseStats = (propertyId: string) => {
    return trpc.leases.getStats.useQuery(
      { propertyId },
      {
        enabled: !!propertyId,
        staleTime: 1000 * 60 * 5, // 5 minutes
      }
    );
  };

  // Get maintenance stats for a property
  const getMaintenanceStats = (propertyId: string) => {
    return trpc.maintenance.getStats.useQuery(
      { propertyId },
      {
        enabled: !!propertyId,
        staleTime: 1000 * 60 * 5, // 5 minutes
      }
    );
  };

  // Set active property
  const setActive = (property: any) => {
    if (setActiveProperty) {
      setActiveProperty(property);
    }
  };

  return {
    properties: data,
    activeProperty,
    setActiveProperty: setActive,
    isLoading,
    error,
    refetch,
    getPropertyStats,
    getLeaseStats,
    getMaintenanceStats,
  };
}
