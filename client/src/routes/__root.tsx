import { AppLayout } from "@/components/layout/app-layout";
import { DefaultNotFound } from "@/components/not-found/default-not-found";
import { AuthProvider, type AuthContext } from "@/providers/auth-provider";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface MyRouterContext {
  auth: AuthContext;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <AuthProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
      {process.env.NODE_ENV === "development" && <TanStackRouterDevtools />}
    </AuthProvider>
  ),
  notFoundComponent: () => (
    <DefaultNotFound
      title="Page Not Found"
      message="Sorry, we couldn't find the page you're looking for."
    />
  ),
});
