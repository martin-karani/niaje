import { MainLayout } from "@/components/layout/main-layout";
import { AuthProvider } from "@/providers/auth-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <TRPCProvider>
      <AuthProvider>
        <MainLayout>
          <Outlet />
        </MainLayout>
        {process.env.NODE_ENV === "development" && <TanStackRouterDevtools />}
      </AuthProvider>
    </TRPCProvider>
  ),
});
