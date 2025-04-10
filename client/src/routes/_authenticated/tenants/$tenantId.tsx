// src/routes/_authenticated/tenants/$tenantId.tsx
import { TenantProfile } from "@/features/tenants/tenant-profile";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  component: TenantDetail,
});

function TenantDetail() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock tenant data - in a real app this would come from an API call
  const tenant = {
    id: "1",
    name: "Leslie Alexander",
    email: "leslie.alexander@example.com",
    phone: "(505) 555-0125",
    address: "Lansing, Illinois",
    propertyName: "Sobha Garden",
    unit: "101",
    dateOfBirth: "1993-12-21",
    moveInDate: "2024-06-01",
    leaseEnd: "2025-06-01",
    emergencyContact: {
      name: "Jacob Jones",
      relationship: "Wife",
      phone: "01524-789631",
      email: "hello741@gmail.com",
    },
  };

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true);

    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [params.tenantId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="text-destructive text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Tenant</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => navigate({ to: "/tenants" })}
          >
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  return <TenantProfile tenant={tenant} />;
}

export default TenantDetail;
