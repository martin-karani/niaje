import { JSX } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../state/auth-store";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    // Return a loading state while checking authentication
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  return children;
};
