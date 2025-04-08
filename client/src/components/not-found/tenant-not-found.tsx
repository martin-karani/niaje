import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Users } from "lucide-react";

export function TenantNotFound() {
  const { user } = useAuth();
  const canAddTenants =
    user?.role === "landlord" ||
    user?.role === "agent" ||
    user?.role === "caretaker";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Users className="h-12 w-12 text-muted-foreground" />
      </div>

      <h1 className="text-3xl font-bold mb-2">Tenant Not Found</h1>
      <p className="text-muted-foreground text-lg max-w-lg mb-8">
        The tenant you're looking for doesn't exist or you don't have permission
        to view their information.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>

        <Button asChild>
          <Link to="/tenants">
            <Users className="mr-2 h-4 w-4" />
            View All Tenants
          </Link>
        </Button>

        {canAddTenants && (
          <Button asChild>
            <Link to="/tenants/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
