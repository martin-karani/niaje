import { TenantNotFound } from "@/components/not-found/tenant-not-found";
import { TenantProfile } from "@/features/tenants/tenant-profile";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  loader: async ({ params }) => {
    try {
      const tenantId = params.tenantId;

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { data } = useQuery({
        queryKey: ["tenant", tenantId],
        queryFn: () => trpc.tenants.getById.query(tenantId),
      });

      const tenant = data.tenant;

      return {
        tenant,
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
            label: tenant.name,
            path: `/tenants/${tenant.id}`,
            hideOnMobile: false,
          },
        ],
      };
    } catch (error) {
      console.error("Error loading tenant:", error);
      throw new Error("Failed to load tenant");
    }
  },
  pendingComponent: LoadingTenant,
  errorComponent: TenantError,
  notFoundComponent: TenantNotFound,
  component: TenantDetail,
});

function LoadingTenant() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4">Loading tenant information...</p>
      </div>
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
  const { tenant } = Route.useLoaderData();
  return <TenantProfile tenant={tenant} />;
}

export default TenantDetail;
