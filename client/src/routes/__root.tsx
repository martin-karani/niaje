import { MainLayout } from "@/components/layout/main-layout";
import { DefaultNotFound } from "@/components/not-found/default-not-found";
import { type AuthContext } from "@/providers/auth-provider";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface MyRouterContext {
  auth: AuthContext;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>
      {process.env.NODE_ENV === "development" && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </>
  ),
  notFoundComponent: () => (
    <DefaultNotFound
      title="Page Not Found"
      message="Sorry, we couldn't find the page you're looking for."
    />
  ),
});
