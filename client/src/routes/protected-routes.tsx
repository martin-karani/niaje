import { Center, Loader } from "@mantine/core";
import { JSX } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../state/auth-store";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, organizations, organization } =
    useAuthStore();

  console.log("ProtectedRoute", {
    isAuthenticated,
    isLoading,
    organizations,
    organization,
  });
  const location = useLocation();

  if (isLoading) {
    // Return a loading state while checking authentication
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  // If authenticated but no organization is selected and we're not on the organization selection page
  if (
    !organization &&
    organizations &&
    organizations.length > 0 &&
    location.pathname !== "/organizations"
  ) {
    // Redirect to organization selection page
    return <Navigate to="/organizations" replace />;
  }

  return children;
};
