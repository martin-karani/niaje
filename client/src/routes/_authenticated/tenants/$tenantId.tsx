import { TenantNotFound } from "@/components/not-found/tenant-not-found";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { TenantProfile } from "@/features/tenants/tenant-profile";
import { usePayments } from "@/hooks/use-payments";
import { useTenants } from "@/hooks/use-tenants";
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
// Main component
function TenantDetail() {
  const { tenantId } = Route.useLoaderData();

  console.log("Tenant ID:", tenantId);
  // Fetch tenant data using the tRPC hook
  const { getById } = useTenants();
  const {
    data,
    isLoading: isLoadingTenant,
    error: tenantError,
  } = getById(tenantId);

  // Fetch recent transactions for this tenant
  const { transactions } = usePayments();
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = transactions.getAll({
    tenantId,
    limit: 5, // Only get the 5 most recent transactions
  });

  // Combined loading state
  const isLoading = isLoadingTenant || isLoadingTransactions;

  // Handle loading state
  if (isLoading) {
    return <LoadingTenant />;
  }

  // Handle error state
  if (tenantError || !data) {
    return (
      <TenantError
        error={tenantError || { message: "Failed to load tenant information" }}
      />
    );
  }

  // The tenant data is directly in 'data', not in 'data.tenant'
  const tenant = data;

  // Handle not found state - check if the tenant object is empty or doesn't have an id
  if (!tenant || !tenant.id) {
    return <TenantNotFound />;
  }

  // If we have transaction data, prepare it for the component
  const recentTransactions =
    transactionsData?.transactions?.map((tx) => ({
      id: tx.id,
      date: tx.paymentDate
        ? new Date(tx.paymentDate).toLocaleDateString()
        : "N/A",
      status:
        tx.status === "completed"
          ? "Paid"
          : tx.status === "pending"
          ? "Pending"
          : tx.status === "failed"
          ? "Failed"
          : "Overdue",
      unit: tx.lease?.unit?.name || "Unknown",
      memo: tx.notes || tx.type || "Transaction",
      amount: Number(tx.amount),
    })) || [];

  // If there was an error loading transactions, we'll still show the tenant
  // profile but with empty transactions
  if (transactionsError) {
    console.error("Error loading transactions:", transactionsError);
  }

  // Pass the tenant directly (not data.tenant) and transactions data to the profile component
  return (
    <TenantProfile tenant={tenant} recentTransactions={recentTransactions} />
  );
}

export default TenantDetail;
