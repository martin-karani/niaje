import { TenantNotFound } from "@/components/not-found/tenant-not-found";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { TenantProfile } from "@/features/tenants/tenant-profile";
import { useTenants } from "@/hooks/use-trpc";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  loader: ({ params }) => {
    const tenantId = params.tenantId;

    return {
      tenantId,
      crumb: [
        {
          label: "Dashboard",
          path: "/dashboard",
          hideOnMobile: true,
        },
        {
          label: "Tenants",
          path: "/tenants",
          hideOnMobile: true,
        },
        {
          label: "", // Will be filled with tenant name once data is loaded
          path: `/tenants/${tenantId}`,
          hideOnMobile: false,
        },
      ],
    };
  },
  component: TenantDetail,
});

function LoadingTenant() {
  return (
    <div className="flex items-center justify-center p-12">
      <LoadingSpinner size="lg" />
      <p className="ml-4">Loading tenant information...</p>
    </div>
  );
}

function TenantError({ error }: { error: { message?: string } }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center max-w-md">
        <div className="text-destructive text-6xl mb-4">!</div>
        <h2 className="text-2xl font-bold mb-2">Error Loading Tenant</h2>
        <p className="text-muted-foreground mb-6">
          {error?.message || "Something went wrong"}
        </p>
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

// Main component
function TenantDetail() {
  const { tenantId } = Route.useLoaderData();

  // Fetch tenant data using the tRPC hook
  const { getById } = useTenants();
  const { data, isLoading, error } = getById(tenantId);

  if (isLoading) {
    return <LoadingTenant />;
  }

  if (error || !data) {
    return <TenantError error={error || { message: "Tenant not found" }} />;
  }

  if (!data.tenant) {
    return <TenantNotFound />;
  }

  return <TenantProfile tenant={data.tenant} />;
}

export default TenantDetail;
