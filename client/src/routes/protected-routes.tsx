import { Center, Loader, Stack, Text } from "@mantine/core";
import { JSX } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../state/auth-store";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const {
    isAuthenticated,
    isLoading,
    // organizations,
    organization,
    // isInitialized,
  } = useAuthStore();

  const location = useLocation();

  // Wait for auth to initialize before making any decisions
  if (isLoading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Stack align="center" spacing="md">
          <Loader size="lg" />
          <Text size="sm" color="dimmed">
            Loading...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  // If authenticated but no organization is selected and we're not on the organization selection page
  if (
    !organization &&
    location.pathname !== "/organizations" &&
    location.pathname !== "/organizations/create"
  ) {
    // Redirect to organization selection page - this happens regardless of whether they have organizations
    // The organization page will handle showing the right UI based on whether they have organizations
    return <Navigate to="/organizations" replace />;
  }

  // If everything is good, render the children
  return children;
};
