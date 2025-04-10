"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";
import {
  Building,
  CreditCard,
  FileIcon,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { useLocation, useNavigate } from "@tanstack/react-router";

export function MainSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Early return if no user
  if (!user) return null;

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    return location.pathname.startsWith(url);
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Properties",
        url: "/properties",
        icon: Building,
      },
      {
        title: "Tenants",
        url: "/tenants",
        icon: Users,
      },
      {
        title: "Leasing",
        url: "/leases",
        icon: FileText,
      },
      {
        title: "Maintenance",
        url: "/maintenance",
        icon: Wrench,
      },
      {
        title: "Payments",
        url: "/finances",
        icon: CreditCard,
      },
      {
        title: "Document",
        url: "/documents",
        icon: FileIcon,
      },
    ];

    // Return different navigation items based on user role
    switch (user.role) {
      case "landlord":
        return commonItems;
      case "caretaker":
        // Filter out financial reports for caretaker
        return commonItems.filter((item) => item.title !== "Financial Reports");
      case "agent":
        // Filter out certain items for agent
        return commonItems.filter(
          (item) => !["Reports", "Maintenance Reports"].includes(item.title)
        );
      default:
        return commonItems;
    }
  };

  const navItems = getNavItems();

  // Settings and support items at the bottom
  const bottomNavItems = [
    {
      title: "Setting",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help & Support",
      url: "/support",
      icon: HelpCircle,
    },
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: "/auth/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="bg-white">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Home className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Niaje </span>
                <span className="truncate text-xs capitalize">{user.role}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={cn(
                      "transition-colors hover:bg-gray-100",
                      isActive(item.url) &&
                        "bg-gray-100 border-l-4 border-blue-500"
                    )}
                  >
                    <a
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate({ to: item.url });
                      }}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          isActive(item.url) ? "text-blue-500" : "text-gray-500"
                        )}
                      />
                      <span
                        className={cn(
                          isActive(item.url)
                            ? "text-blue-500 font-medium"
                            : "text-gray-700"
                        )}
                      >
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-gray-200">
        {/* Settings and Support */}
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className="transition-colors hover:bg-gray-100"
              >
                <a
                  href={item.url}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate({ to: item.url });
                  }}
                >
                  <item.icon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Logout Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="transition-colors hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
