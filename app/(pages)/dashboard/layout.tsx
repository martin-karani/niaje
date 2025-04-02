"use client"
// app/dashboard/layout.tsx
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/better-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BuildingIcon, 
  HomeIcon, 
  UserIcon, 
  BanknoteIcon, 
  WrenchIcon, 
  BarChartIcon,
  CalendarIcon,
  UsersIcon
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in?return_to=/dashboard');
    }
  }, [isLoading, user, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect will redirect. 
  // This check is just an extra precaution.
  if (!user) {
    return null;
  }

  // Get navigation links based on user role
  const getNavItems = () => {
    const items = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: HomeIcon,
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        href: "/properties",
        label: "Properties",
        icon: BuildingIcon,
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        href: "/tenants",
        label: "Tenants",
        icon: UserIcon,
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        href: "/payments",
        label: "Payments",
        icon: BanknoteIcon,
        roles: ["landlord", "caretaker"],
      },
      {
        href: "/maintenance",
        label: "Maintenance",
        icon: WrenchIcon,
        roles: ["landlord", "caretaker", "agent"],
      },
      {
        href: "/reports",
        label: "Reports",
        icon: BarChartIcon,
        roles: ["landlord"],
      },
      {
        href: "/viewings",
        label: "Viewings",
        icon: CalendarIcon,
        roles: ["agent"],
      },
      {
        href: "/leads",
        label: "Leads",
        icon: UsersIcon,
        roles: ["agent"],
      },
    ];

    return items.filter(item => item.roles.includes(user.role));
  };

  const navItems = getNavItems();

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow overflow-y-auto border-r bg-background">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
            <Link href="/dashboard" className="flex items-center">
              <BuildingIcon className="h-6 w-6" />
              <span className="ml-2 text-lg font-semibold">Property Manager</span>
            </Link>
          </div>
          <div className="flex-grow flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    window.location.pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5",
                      window.location.pathname === item.href
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 border-b">
          <Link href="/dashboard" className="flex items-center">
            <BuildingIcon className="h-6 w-6" />
            <span className="ml-2 text-lg font-semibold">Property Manager</span>
          </Link>
        </div>

        {/* Content */}
        <main className="flex-1 relative overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}