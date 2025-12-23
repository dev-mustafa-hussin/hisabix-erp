import { User, CreditCard, Package, ShoppingCart, Truck } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import QuickAccess from "@/components/dashboard/QuickAccess";
import StatsCards from "@/components/dashboard/StatsCards";
import SalesChart from "@/components/dashboard/SalesChart";
import DataTable from "@/components/dashboard/DataTable";

const Dashboard = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />
      
      <main className="lg:mr-64 pt-14 p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
            </div>
          </div>
          <div className="text-right sm:text-left">
            <h1 className="text-lg lg:text-xl font-bold text-card-foreground flex flex-col sm:flex-row items-start sm:items-center gap-2">
              محمد مجدى مرحباً
              <span className="text-sm font-normal text-muted-foreground">⚡ المتابعة حسب التاريخ</span>
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground">{currentDate}</p>
          </div>
        </div>

        {/* Quick Access */}
        <QuickAccess />

        {/* Stats Cards */}
        <StatsCards />

        {/* Sales Chart */}
        <SalesChart />

        {/* Yearly Sales Chart */}
        <div className="bg-card rounded-xl p-4 lg:p-6 shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs lg:text-sm text-muted-foreground">→ EDOXO (BL0001)</span>
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-card-foreground flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              السنة المالية الحالية
            </h3>
          </div>
          <div className="h-48 lg:h-64 flex items-center justify-center text-muted-foreground text-sm">
            رسم بياني للسنة المالية
          </div>
        </div>

        {/* Payment Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <DataTable
            title="مستحقات مدفوعات المبيعات"
            icon={<CreditCard className="w-5 h-5 text-warning" />}
            columns={["جاز", "الرقم المرجعي", "المبلغ المستحق", "الفاتورة رقم", "عميل"]}
            filterTabs={["تصدير إلى CSV", "تصدير إلى Excel", "طباعة", "صف الصفوف"]}
          />
          <DataTable
            title="مستحقات مدفوعات المشتريات"
            icon={<CreditCard className="w-5 h-5 text-warning" />}
            columns={["جاز", "الرقم المرجعي", "المبلغ المستحق", "البيع السعودي", "مورد"]}
            filterTabs={["تصدير إلى CSV", "تصدير إلى Excel", "طباعة", "صف الصفوف"]}
          />
        </div>

        {/* Inventory Alert */}
        <DataTable
          title="تنبيه المخزون"
          icon={<Package className="w-5 h-5 text-primary" />}
          columns={["المخزون الحالي", "الفرق", "منتج"]}
          filterTabs={["تصدير إلى CSV", "تصدير إلى Excel", "طباعة", "صف الصفوف"]}
        />

        {/* Sales Orders */}
        <div className="overflow-x-auto">
          <DataTable
            title="طلب المبيعات"
            icon={<ShoppingCart className="w-5 h-5 text-primary" />}
            columns={["إجمال تكلفة", "حالة الشحن", "الكمية المطلوبة", "رقم الاتصال", "القيمة", "الحالة", "رقم التاريخ", "رقم الطلب", "إسم العميل", "التاريخ", "م"]}
            filterTabs={["تصدير إلى CSV", "تصدير إلى Excel", "طباعة", "صف الصفوف"]}
          />
        </div>

        {/* Pending Shipments */}
        <div className="overflow-x-auto">
          <DataTable
            title="الشحنات المعلقة"
            icon={<Truck className="w-5 h-5 text-primary" />}
            columns={["حالة الدفع", "حالة الشحن", "الفرق", "رقم الفاتورة", "إسم العميل", "التاريخ", "الفاتورة رقم", "م"]}
            filterTabs={["تصدير إلى CSV", "تصدير إلى Excel", "طباعة", "رقم الصفوف"]}
          />
        </div>

        {/* Footer */}
        <footer className="text-center py-4 lg:py-6 text-xs lg:text-sm text-muted-foreground border-t border-border">
          HisabiX | Cloud ERP, Accounting, Sales, Inventory Software - V1.0 | Copyright © 2025 All rights reserved.
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
