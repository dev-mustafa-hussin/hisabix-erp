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
      
      <main className="mr-64 pt-14 p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <span className="text-sm font-normal text-muted-foreground">⚡ المتابعة حسب التاريخ</span>
              محمد مجدى مرحباً
            </h1>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
        </div>

        {/* Quick Access */}
        <QuickAccess />

        {/* Stats Cards */}
        <StatsCards />

        {/* Sales Chart */}
        <SalesChart />

        {/* Yearly Sales Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">→ EDOXO (BL0001)</span>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              السنة المالية الحالية
            </h3>
          </div>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            رسم بياني للسنة المالية
          </div>
        </div>

        {/* Payment Tables */}
        <div className="grid grid-cols-2 gap-6">
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
        <DataTable
          title="طلب المبيعات"
          icon={<ShoppingCart className="w-5 h-5 text-primary" />}
          columns={["إجمال تكلفة", "حالة الشحن", "الكمية المطلوبة", "رقم الاتصال", "القيمة", "الحالة", "رقم التاريخ", "رقم الطلب", "إسم العميل", "التاريخ", "م"]}
          filterTabs={["تصدير إلى CSV", "تصدير إلى Excel", "طباعة", "صف الصفوف"]}
        />

        {/* Pending Shipments */}
        <DataTable
          title="الشحنات المعلقة"
          icon={<Truck className="w-5 h-5 text-primary" />}
          columns={["حالة الدفع", "حالة الشحن", "الفرق", "رقم الفاتورة", "إسم العميل", "التاريخ", "الفاتورة رقم", "م"]}
          filterTabs={["تصدير إلى CSV", "تصدير إلى Excel", "طباعة", "رقم الصفوف"]}
        />

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-muted-foreground border-t border-border">
          HisabiX | Cloud ERP, Accounting, Sales, Inventory Software - V1.0 | Copyright © 2025 All rights reserved.
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
