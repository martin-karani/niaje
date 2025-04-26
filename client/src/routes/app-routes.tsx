import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { useAuthStore } from "../state/auth-store";

// Layouts
import AppLayout from "../components/layouts/app-layout";
import AuthLayout from "../components/layouts/auth-layout";

// Auth pages
import ForgotPassword from "../pages/auth/forgot-password";
import ResetPassword from "../pages/auth/reset-password";
import SignIn from "../pages/auth/sign-in";
import SignUp from "../pages/auth/sign-up";
import VerifyEmail from "../pages/auth/verify-email";

// App pages
import Dashboard from "../pages/dashboard";
import OrganizationSelection from "../pages/organisations";
import OrganizationCreate from "../pages/organisations/create";
import PropertiesList from "../pages/properties";
import PropertyCreate from "../pages/properties/create";
import PropertyDetail from "../pages/properties/details";
import { ProtectedRoute } from "./protected-routes";

export default function AppRoutes() {
  const {
    initialize,
    isAuthenticated,
    isLoading,
    organizations,
    organization,
    isInitialized,
  } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Handle redirection based on auth state
  useEffect(() => {
    if (isLoading || !isInitialized) return;

    // If authenticated
    if (isAuthenticated) {
      // If user is on auth route, redirect to dashboard or org selection
      if (
        location.pathname.startsWith("/auth") &&
        location.pathname !== "/auth/verify-email"
      ) {
        // Check if user needs to select organization
        if (!organization) {
          navigate("/organizations");
        } else {
          navigate("/dashboard");
        }
      }
    }
    // If not authenticated and not on auth route, redirect to login
    else if (!location.pathname.startsWith("/auth")) {
      navigate("/auth/sign-in");
    }
  }, [
    isAuthenticated,
    isLoading,
    isInitialized,
    location.pathname,
    navigate,
    organization,
    organizations,
  ]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Organization selection/creation routes */}
      <Route
        path="/organizations"
        element={
          <ProtectedRoute>
            <OrganizationSelection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizations/create"
        element={
          <ProtectedRoute>
            <OrganizationCreate />
          </ProtectedRoute>
        }
      />

      {/* Protected app routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Properties routes */}
        <Route path="properties">
          <Route index element={<PropertiesList />} />
          <Route path="create" element={<PropertyCreate />} />
          <Route path=":id" element={<PropertyDetail />} />
        </Route>

        {/* Add other routes here */}

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}
