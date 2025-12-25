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
import Products from "./pages/products/ProductList";
import AddProduct from "./pages/products/AddProduct";
import UpdatePrice from "./pages/products/UpdatePrice";
import PrintLabels from "./pages/products/PrintLabels";
import Variations from "./pages/products/Variations";
import ImportProducts from "./pages/products/ImportProducts";
import ImportOpeningStock from "./pages/products/ImportOpeningStock";
import SellingPriceGroups from "./pages/products/SellingPriceGroups";
import Units from "./pages/products/Units";
import Categories from "./pages/products/Categories";
import Brands from "./pages/products/Brands";
import Warranties from "./pages/products/Warranties";

import PurchaseList from "./pages/purchases/PurchaseList";
import AddPurchase from "./pages/purchases/AddPurchase";
import PurchaseReturns from "./pages/purchases/PurchaseReturns";

import SalesList from "./pages/sales/SalesList";
import AddSale from "./pages/sales/AddSale";
import POSList from "./pages/sales/POSList";
import POS from "./pages/sales/POS";
import AddDraft from "./pages/sales/AddDraft";
import DraftList from "./pages/sales/DraftList";
import AddQuotation from "./pages/sales/AddQuotation";
import QuotationList from "./pages/sales/QuotationList";
import SalesReturnList from "./pages/sales/SalesReturnList";
import Shipments from "./pages/sales/Shipments";
import Discounts from "./pages/sales/Discounts";
import ImportSales from "./pages/sales/ImportSales";

import TransferList from "./pages/stock-transfers/TransferList";
import AddTransfer from "./pages/stock-transfers/AddTransfer";

import DamagedStockList from "./pages/damaged-stock/DamagedStockList";
import AddDamagedStock from "./pages/damaged-stock/AddDamagedStock";

import ExpenseList from "./pages/expenses/ExpenseList";
import AddExpense from "./pages/expenses/AddExpense";
import ExpenseCategories from "./pages/expenses/ExpenseCategories";

import CheckList from "./pages/checks/CheckList";
import AddCheck from "./pages/checks/AddCheck";

import AuditList from "./pages/inventory-audit/AuditList";
import AddAudit from "./pages/inventory-audit/AddAudit";

import NotificationTemplates from "./pages/settings/NotificationTemplates";
import Branches from "./pages/settings/Branches";
import InvoiceSettings from "./pages/settings/InvoiceSettings";
import BarcodeSettings from "./pages/settings/BarcodeSettings";
import Printers from "./pages/settings/Printers";
import TaxRates from "./pages/settings/TaxRates";
import Subscription from "./pages/settings/Subscription";

import ProfitLoss from "./pages/reports/ProfitLoss";
import PurchasesSales from "./pages/reports/PurchasesSales";
import TaxReport from "./pages/reports/TaxReport";
import ContactReport from "./pages/reports/ContactReport";
import InventoryReport from "./pages/reports/InventoryReport";
import TrendingProducts from "./pages/reports/TrendingProducts";
import SalesReport from "./pages/reports/SalesReport";
import ExpenseReport from "./pages/reports/ExpenseReport";
import ActivityLog from "./pages/reports/ActivityLog";

import Users from "./pages/user-management/Users";
import Permissions from "./pages/user-management/Permissions";
import Delegates from "./pages/user-management/Delegates";
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
                  path="/products/add"
                  element={
                    <ProtectedRoute>
                      <AddProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/update-price"
                  element={
                    <ProtectedRoute>
                      <UpdatePrice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/labels"
                  element={
                    <ProtectedRoute>
                      <PrintLabels />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/variations"
                  element={
                    <ProtectedRoute>
                      <Variations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/import"
                  element={
                    <ProtectedRoute>
                      <ImportProducts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/opening-stock"
                  element={
                    <ProtectedRoute>
                      <ImportOpeningStock />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/selling-price-groups"
                  element={
                    <ProtectedRoute>
                      <SellingPriceGroups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/units"
                  element={
                    <ProtectedRoute>
                      <Units />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/categories"
                  element={
                    <ProtectedRoute>
                      <Categories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/brands"
                  element={
                    <ProtectedRoute>
                      <Brands />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/warranties"
                  element={
                    <ProtectedRoute>
                      <Warranties />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <SalesList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/add"
                  element={
                    <ProtectedRoute>
                      <AddSale />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/pos-list"
                  element={
                    <ProtectedRoute>
                      <POSList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <POS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/add-draft"
                  element={
                    <ProtectedRoute>
                      <AddDraft />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/drafts"
                  element={
                    <ProtectedRoute>
                      <DraftList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/add-quotation"
                  element={
                    <ProtectedRoute>
                      <AddQuotation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/quotations"
                  element={
                    <ProtectedRoute>
                      <QuotationList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/returns"
                  element={
                    <ProtectedRoute>
                      <SalesReturnList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/shipments"
                  element={
                    <ProtectedRoute>
                      <Shipments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/discounts"
                  element={
                    <ProtectedRoute>
                      <Discounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/import"
                  element={
                    <ProtectedRoute>
                      <ImportSales />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/purchases"
                  element={
                    <ProtectedRoute>
                      <PurchaseList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchases/add"
                  element={
                    <ProtectedRoute>
                      <AddPurchase />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchases/returns"
                  element={
                    <ProtectedRoute>
                      <PurchaseReturns />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/stock-transfers"
                  element={
                    <ProtectedRoute>
                      <TransferList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock-transfers/add"
                  element={
                    <ProtectedRoute>
                      <AddTransfer />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/damaged-stock"
                  element={
                    <ProtectedRoute>
                      <DamagedStockList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/damaged-stock/add"
                  element={
                    <ProtectedRoute>
                      <AddDamagedStock />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/expenses"
                  element={
                    <ProtectedRoute>
                      <ExpenseList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expenses/add"
                  element={
                    <ProtectedRoute>
                      <AddExpense />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expenses/categories"
                  element={
                    <ProtectedRoute>
                      <ExpenseCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checks"
                  element={
                    <ProtectedRoute>
                      <CheckList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checks/add"
                  element={
                    <ProtectedRoute>
                      <AddCheck />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/inventory-audit"
                  element={
                    <ProtectedRoute>
                      <AuditList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory-audit/add"
                  element={
                    <ProtectedRoute>
                      <AddAudit />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/notification-templates"
                  element={
                    <ProtectedRoute>
                      <NotificationTemplates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/branches"
                  element={
                    <ProtectedRoute>
                      <Branches />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/invoice"
                  element={
                    <ProtectedRoute>
                      <InvoiceSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/barcode"
                  element={
                    <ProtectedRoute>
                      <BarcodeSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/printers"
                  element={
                    <ProtectedRoute>
                      <Printers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/tax-rates"
                  element={
                    <ProtectedRoute>
                      <TaxRates />
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
                  path="/settings/subscription"
                  element={
                    <ProtectedRoute>
                      <Subscription />
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
