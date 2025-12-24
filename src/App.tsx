import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SidebarProvider } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Group A: Enabled
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";

// Group B: Commented Out (Suspected Zone)
/*
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Receivables from "./pages/Receivables";
*/

// Batch 2: Commented Out
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
  console.log("App: Rendering started (Group A Active)");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Group A Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  }
                />

                {/* Group B Routes (Commented) */}
                {/*
                  <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                  <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/receivables" element={<ProtectedRoute><Receivables /></ProtectedRoute>} />
                  */}

                <Route
                  path="*"
                  element={
                    <div className="p-20 text-center text-red-500">
                      Page Not Found (Group B or Batch 2 might be commented out)
                      - Path: {window.location.pathname}
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
