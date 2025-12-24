import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SidebarProvider } from "@/contexts/SidebarContext";

// Temporarily commenting out all pages to find the breaking one
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Receivables from "./pages/Receivables";
/*
import CompanySettings from "./pages/CompanySettings";
import NotificationSettings from "./pages/NotificationSettings";
import NotificationLogs from "./pages/NotificationLogs";
import NotificationsDashboard from "./pages/NotificationsDashboard";
import InventoryReport from "./pages/InventoryReport";
import UserManagement from "./pages/UserManagement";
import AuditLogs from "./pages/AuditLogs";
import AcceptInvitation from "./pages/AcceptInvitation";
import ProfileSettings from "./pages/ProfileSettings";
import OnlineStoreSettings from "./pages/OnlineStoreSettings";
import NotFound from "./pages/NotFound";
*/

const queryClient = new QueryClient();

const App = () => {
  console.log("App: Rendering started (Minimal Version)");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route
                  path="*"
                  element={
                    <div className="p-20 text-center">
                      App is working - Path: {window.location.pathname}
                    </div>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
