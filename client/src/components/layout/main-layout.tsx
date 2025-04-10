import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/providers/auth-provider";
import React from "react";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { MainSidebar } from "./main-sidebar";
import { TopNav } from "./top-nav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  // If no user, render only children (for auth pages)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SidebarProvider>
        <MainSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <SidebarInset>
          <TopNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="container py-6 px-4 md:px-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
