import { AppLayout } from "@/components/layout/app-layout";
import { DefaultNotFound } from "@/components/not-found/default-not-found";
import { AuthProvider } from "@/providers/auth-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoading) {
      return;
    }

    if (!context.auth.user) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: () => (
    <TRPCProvider>
      <AuthProvider>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </AuthProvider>
    </TRPCProvider>
  ),
  notFoundComponent: () => (
    <DefaultNotFound
      title="Page Not Found"
      message="The page you're looking for doesn't exist or you don't have permission to access it."
    />
  ),
});
