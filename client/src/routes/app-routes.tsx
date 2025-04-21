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

// App pages
// Import other pages as they're created
import Dashboard from "../pages/dashboard";
import { ProtectedRoute } from "./protected-routes";
// Placeholder components for routes
const Properties = () => <div>Properties Page</div>;
const PropertyDetail = () => <div>Property Detail Page</div>;
const Units = () => <div>Units Page</div>;
const Tenants = () => <div>Tenants Page</div>;
const TenantDetail = () => <div>Tenant Detail Page</div>;
const Leases = () => <div>Leases Page</div>;
const LeaseDetail = () => <div>Lease Detail Page</div>;
const Maintenance = () => <div>Maintenance Page</div>;
const Billing = () => <div>Billing Page</div>;
const Reports = () => <div>Reports Page</div>;
const Settings = () => <div>Settings Page</div>;

export default function AppRoutes() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle redirection based on auth state
  useEffect(() => {
    if (isLoading) return;

    // If authenticated and on auth route, redirect to dashboard
    if (!isAuthenticated && location.pathname.startsWith("/auth")) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

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
          <Route index element={<Properties />} />
          <Route path=":id" element={<PropertyDetail />} />
          <Route path="units" element={<Units />} />
        </Route>

        {/* Tenants routes */}
        <Route path="tenants">
          <Route index element={<Tenants />} />
          <Route path=":id" element={<TenantDetail />} />
        </Route>

        {/* Leases routes */}
        <Route path="leases">
          <Route index element={<Leases />} />
          <Route path=":id" element={<LeaseDetail />} />
        </Route>

        {/* Maintenance routes */}
        <Route path="maintenance">
          <Route index element={<Maintenance />} />
        </Route>

        {/* Billing routes */}
        <Route path="billing">
          <Route index element={<Billing />} />
          <Route path="payments" element={<div>Payments</div>} />
          <Route path="expenses" element={<div>Expenses</div>} />
          <Route path="utilities" element={<div>Utilities</div>} />
        </Route>

        {/* Reports routes */}
        <Route path="reports">
          <Route index element={<Reports />} />
          <Route path="financial" element={<div>Financial Reports</div>} />
          <Route path="occupancy" element={<div>Occupancy Reports</div>} />
          <Route path="maintenance" element={<div>Maintenance Reports</div>} />
        </Route>

        {/* Settings routes */}
        <Route path="settings">
          <Route index element={<Settings />} />
          <Route path="profile" element={<div>Profile Settings</div>} />
          <Route
            path="organization"
            element={<div>Organization Settings</div>}
          />
        </Route>

        {/* Organization routes */}
        <Route path="organization">
          <Route index element={<div>Organization</div>} />
          <Route path="members" element={<div>Team Members</div>} />
          <Route path="teams" element={<div>Teams</div>} />
          <Route path="subscription" element={<div>Subscription</div>} />
          <Route path="create" element={<div>Create Organization</div>} />
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}
