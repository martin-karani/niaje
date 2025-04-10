import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Link, useRouter } from "@tanstack/react-router";
import {
  BarChart,
  Building,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import React from "react";
import { PropertySwitcher } from "../common/property-switcher";

interface SidebarProps {
  collapsible?: "icon" | "none" | "offcanvas";

  open?: boolean;

  onOpenChange?: (open: boolean) => void;
}
type NavItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
  subItems?: {
    title: string;
    path: string;
  }[];
};

export function MainSidebar({ open, onOpenChange, ...props }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const currentRoute = router.state.location.pathname;

  const menuItems = React.useMemo(() => {
    const items: NavItem[] = [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        title: "Units",
        icon: Building,
        path: "/units",
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        title: "Tenants",
        icon: Users,
        path: "/tenants",
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        title: "Leasing",
        icon: FileText,
        path: "/leases",
        roles: ["landlord", "agent"],
      },
      {
        title: "Maintenance",
        icon: Wrench,
        path: "/maintenance",
        roles: ["landlord", "caretaker"],
      },
      {
        title: "Finances",
        icon: CreditCard,
        path: "/finances",
        subItems: [
          { title: "Payments", path: "/finances/payments" },
          { title: "Expenses", path: "/finances/expenses" },
        ],
        roles: ["landlord"],
      },
      {
        title: "Calendar",
        icon: CalendarDays,
        path: "/calendar",
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        title: "Reports",
        icon: BarChart,
        path: "/reports",
        roles: ["landlord", "caretaker"],
      },
    ];

    // Filter items based on user role
    return items;
  }, [user?.role]);

  // Sidebar is only rendered if there's a user
  if (!user) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PropertySwitcher
          properties={[
            {
              name: "Property 1",
              logo: Building,
              plan: "Basic",
            },
            {
              name: "Property 2",
              logo: Building,
              plan: "Premium",
            },
          ]}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Main Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = currentRoute.startsWith(item.path);

                // Items with subitems
                if (item.subItems) {
                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen={isActive}
                      className="w-full"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                              const isSubActive = currentRoute === subItem.path;
                              return (
                                <Link
                                  key={subItem.path}
                                  to={subItem.path}
                                  className={cn(
                                    "block rounded-md px-3 py-2 text-sm hover:bg-muted",
                                    isSubActive &&
                                      "bg-muted font-medium text-primary"
                                  )}
                                >
                                  {subItem.title}
                                </Link>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Regular items
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Help and logout section */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={() => router.navigate({ to: "/settings" })}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help & Support">
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => logout()}
              tooltip="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
