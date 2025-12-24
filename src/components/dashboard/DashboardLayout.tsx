import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <Header />

      <main
        className={cn(
          "pt-14 p-4 lg:p-6 space-y-4 lg:space-y-6 transition-all duration-300",
          isCollapsed ? "lg:mr-16" : "lg:mr-64"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
