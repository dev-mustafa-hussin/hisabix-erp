import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SidebarProvider } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/contacts/Customers";
import Suppliers from "./pages/contacts/Suppliers";
import CustomerGroups from "./pages/contacts/CustomerGroups";
import ImportContacts from "./pages/contacts/ImportContacts";
import ContactsMap from "./pages/contacts/ContactsMap";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Receivables from "./pages/Receivables";
import CompanySettings from "./pages/CompanySettings";
import NotificationSettings from "./pages/NotificationSettings";
import NotificationLogs from "./pages/NotificationLogs";
import NotificationsDashboard from "./pages/NotificationsDashboard";
import InventoryReport from "./pages/InventoryReport";
import Users from "./pages/user-management/Users";
import Permissions from "./pages/user-management/Permissions";
import Delegates from "./pages/user-management/Delegates";
import AuditLogs from "./pages/AuditLogs";
import AcceptInvitation from "./pages/AcceptInvitation";
import ProfileSettings from "./pages/ProfileSettings";
import OnlineStoreSettings from "./pages/OnlineStoreSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log("App: Rendering fully restored version");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/accept-invitation"
                  element={<AcceptInvitation />}
                />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts/customers"
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts/suppliers"
                  element={
                    <ProtectedRoute>
                      <Suppliers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts/groups"
                  element={
                    <ProtectedRoute>
                      <CustomerGroups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts/import"
                  element={
                    <ProtectedRoute>
                      <ImportContacts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts/map"
                  element={
                    <ProtectedRoute>
                      <ContactsMap />
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
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <Sales />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receivables"
                  element={
                    <ProtectedRoute>
                      <Receivables />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company-settings"
                  element={
                    <ProtectedRoute>
                      <CompanySettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notification-settings"
                  element={
                    <ProtectedRoute>
                      <NotificationSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notification-logs"
                  element={
                    <ProtectedRoute>
                      <NotificationLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications-dashboard"
                  element={
                    <ProtectedRoute>
                      <NotificationsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory-report"
                  element={
                    <ProtectedRoute>
                      <InventoryReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-management/users"
                  element={
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-management/permissions"
                  element={
                    <ProtectedRoute>
                      <Permissions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-management/delegates"
                  element={
                    <ProtectedRoute>
                      <Delegates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute>
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile-settings"
                  element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/online-store-settings"
                  element={
                    <ProtectedRoute>
                      <OnlineStoreSettings />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
