"use client";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useLocation } from "@tanstack/react-router";
import React from "react";
import { MainSidebar } from "./main-sidebar";

type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  // Don't show sidebar on auth pages
  const isAuthPage = location.pathname.startsWith("/auth/");

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Function to get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";

    // Split the path and capitalize each segment
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";

    // Handle special cases like $propertyId
    const lastSegment = segments[segments.length - 1];
    if (lastSegment.startsWith("$")) {
      // This is a dynamic route, use the previous segment
      return segments.length > 1
        ? capitalizeFirstLetter(segments[segments.length - 2])
        : "Details";
    }

    return capitalizeFirstLetter(lastSegment);
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).replace(/-/g, " ");
  };

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
