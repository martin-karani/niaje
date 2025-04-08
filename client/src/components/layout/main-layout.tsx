import { Button } from "@/components/ui/button";
import { useAuth, UserRole } from "@/providers/auth-provider";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BarChart,
  Building,
  Calendar,
  CreditCard,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PenTool,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";

// Navigation items based on user role
const navigationItems: Record<
  UserRole,
  { name: string; href: string; icon: React.ReactNode }[]
> = {
  landlord: [
    { name: "Dashboard", href: "/", icon: <Home className="w-5 h-5" /> },
    {
      name: "Properties",
      href: "/properties",
      icon: <Building className="w-5 h-5" />,
    },
    { name: "Tenants", href: "/tenants", icon: <Users className="w-5 h-5" /> },
    {
      name: "Finances",
      href: "/finances",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      name: "Maintenance",
      href: "/maintenance",
      icon: <PenTool className="w-5 h-5" />,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: <BarChart className="w-5 h-5" />,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ],
  caretaker: [
    { name: "Dashboard", href: "/", icon: <Home className="w-5 h-5" /> },
    {
      name: "Properties",
      href: "/properties",
      icon: <Building className="w-5 h-5" />,
    },
    { name: "Tenants", href: "/tenants", icon: <Users className="w-5 h-5" /> },
    {
      name: "Maintenance",
      href: "/maintenance",
      icon: <PenTool className="w-5 h-5" />,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ],
  agent: [
    { name: "Dashboard", href: "/", icon: <Home className="w-5 h-5" /> },
    {
      name: "Properties",
      href: "/properties",
      icon: <Building className="w-5 h-5" />,
    },
    { name: "Tenants", href: "/tenants", icon: <Users className="w-5 h-5" /> },
    {
      name: "Leases",
      href: "/leases",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ],
};

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  if (!user) {
    return <Outlet />;
  }

  const navItems = navigationItems[user.role];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-30 w-64 h-screen transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        } bg-card border-r border-border`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">PropManager</h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground group [&.active]:bg-accent [&.active]:text-accent-foreground"
                    activeProps={{ className: "active" }}
                    onClick={() => setSidebarOpen(true)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between h-14 px-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="ml-auto flex items-center space-x-2">
              {/* Notifications, settings, or other header items can go here */}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                Help
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
};
