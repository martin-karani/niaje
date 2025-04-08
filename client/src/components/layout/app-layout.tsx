import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import {
  Link,
  Outlet,
  ReactNode,
  useMatches,
  useRouter,
} from "@tanstack/react-router";
import {
  BarChart,
  Bell,
  Building,
  Calendar,
  ChevronDown,
  CreditCard,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// Define navigation items based on user role
const getNavigationItems = (role: string) => {
  const items = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: "Properties",
      path: "/properties",
      icon: <Building className="w-5 h-5" />,
    },
    { name: "Tenants", path: "/tenants", icon: <Users className="w-5 h-5" /> },
  ];

  // Role-specific items
  if (role === "landlord" || role === "admin") {
    items.push(
      {
        name: "Finances",
        path: "/finances",
        icon: <CreditCard className="w-5 h-5" />,
      },
      {
        name: "Reports",
        path: "/reports",
        icon: <BarChart className="w-5 h-5" />,
      }
    );
  }

  // Common items for all roles
  items.push(
    {
      name: "Maintenance",
      path: "/maintenance",
      icon: <Wrench className="w-5 h-5" />,
    },
    {
      name: "Calendar",
      path: "/calendar",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      name: "Messages",
      path: "/messages",
      icon: <MessageSquare className="w-5 h-5" />,
    }
  );

  return items;
};
interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const matches = useMatches();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(2); // Example notification count

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.navigate({ to: "/auth/login" });
    }
  }, [user, router]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Get the current route for highlighting active nav item
  const currentPath =
    matches.length > 0 ? matches[matches.length - 1].pathname : "";

  if (!user) {
    return <Outlet />;
  }

  const navigationItems = getNavigationItems(user.role);

  return (
    <div className={`h-screen flex bg-background ${darkMode ? "dark" : ""}`}>
      {/* Sidebar Backdrop (Mobile) */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 w-64 h-screen transition-transform duration-300 ${
          sidebarOpen ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        } bg-card border-r border-border flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
            </div>
            <h1 className="ml-2 text-lg font-bold">Master Key</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    currentPath.startsWith(item.path)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSidebarOpen(true)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* In-App Messages */}
        <div className="p-3 border-t border-b border-border">
          <div className="text-sm font-medium mb-2">Messages</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                A
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm truncate">Adam Barnes</p>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Hi! I'm moving out...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                C
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Cora Richards</p>
                <p className="text-xs text-muted-foreground truncate">
                  Thank you!
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
        </div>

        {/* User Controls */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              className="rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-background py-1.5 pl-10 pr-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-2 border rounded-md px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
