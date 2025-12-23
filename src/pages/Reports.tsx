import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ar } from "date-fns/locale";

interface SalesData {
  date: string;
  total: number;
}

interface InvoiceStatusData {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopCustomer {
  name: string;
  total: number;
}

const Reports = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30");

  // Stats
  const [totalSales, setTotalSales] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [salesGrowth, setSalesGrowth] = useState(0);
  const [invoicesGrowth, setInvoicesGrowth] = useState(0);

  // Chart data
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState<InvoiceStatusData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<{ month: string; sales: number; invoices: number }[]>([]);

  useEffect(() => {
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchAllData();
    }
  }, [companyId, period]);

  const fetchCompanyId = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching company:", error);
      return;
    }

    if (data) {
      setCompanyId(data.company_id);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchSalesChart(),
      fetchInvoiceStatus(),
      fetchTopProducts(),
      fetchTopCustomers(),
      fetchMonthlySales(),
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!companyId) return;

    const periodDays = parseInt(period);
    const startDate = subDays(new Date(), periodDays).toISOString();
    const previousStartDate = subDays(new Date(), periodDays * 2).toISOString();
    const previousEndDate = startDate;

    // Current period sales
    const { data: currentSales } = await supabase
      .from("sales")
      .select("total")
      .eq("company_id", companyId)
      .gte("sale_date", startDate);

    const currentSalesTotal = currentSales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
    setTotalSales(currentSalesTotal);

    // Previous period sales for growth calculation
    const { data: previousSales } = await supabase
      .from("sales")
      .select("total")
      .eq("company_id", companyId)
      .gte("sale_date", previousStartDate)
      .lt("sale_date", previousEndDate);

    const previousSalesTotal = previousSales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
    const growth = previousSalesTotal > 0 
      ? ((currentSalesTotal - previousSalesTotal) / previousSalesTotal) * 100 
      : 0;
    setSalesGrowth(Math.round(growth));

    // Current period invoices
    const { data: currentInvoices, count: invoiceCount } = await supabase
      .from("invoices")
      .select("total", { count: "exact" })
      .eq("company_id", companyId)
      .gte("created_at", startDate);

    setTotalInvoices(invoiceCount || 0);

    // Previous period invoices
    const { count: previousInvoiceCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("created_at", previousStartDate)
      .lt("created_at", previousEndDate);

    const invGrowth = (previousInvoiceCount || 0) > 0 
      ? (((invoiceCount || 0) - (previousInvoiceCount || 0)) / (previousInvoiceCount || 1)) * 100 
      : 0;
    setInvoicesGrowth(Math.round(invGrowth));

    // Total customers
    const { count: customerCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    setTotalCustomers(customerCount || 0);

    // Total products
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true);

    setTotalProducts(productCount || 0);
  };

  const fetchSalesChart = async () => {
    if (!companyId) return;

    const periodDays = parseInt(period);
    const startDate = subDays(new Date(), periodDays).toISOString();

    const { data } = await supabase
      .from("sales")
      .select("sale_date, total")
      .eq("company_id", companyId)
      .gte("sale_date", startDate)
      .order("sale_date", { ascending: true });

    // Group by date
    const grouped: { [key: string]: number } = {};
    data?.forEach((sale) => {
      const date = format(new Date(sale.sale_date), "MM/dd");
      grouped[date] = (grouped[date] || 0) + (sale.total || 0);
    });

    const chartData = Object.entries(grouped).map(([date, total]) => ({
      date,
      total,
    }));

    setSalesData(chartData);
  };

  const fetchInvoiceStatus = async () => {
    if (!companyId) return;

    const { data } = await supabase
      .from("invoices")
      .select("status")
      .eq("company_id", companyId);

    const statusCount: { [key: string]: number } = {};
    data?.forEach((inv) => {
      statusCount[inv.status] = (statusCount[inv.status] || 0) + 1;
    });

    const statusLabels: { [key: string]: string } = {
      draft: "مسودة",
      sent: "مرسلة",
      paid: "مدفوعة",
      partial: "مدفوعة جزئياً",
      overdue: "متأخرة",
      cancelled: "ملغاة",
    };

    const colors: { [key: string]: string } = {
      draft: "#94a3b8",
      sent: "#3b82f6",
      paid: "#22c55e",
      partial: "#eab308",
      overdue: "#ef4444",
      cancelled: "#6b7280",
    };

    const chartData = Object.entries(statusCount).map(([status, value]) => ({
      name: statusLabels[status] || status,
      value,
      color: colors[status] || "#8884d8",
    }));

    setInvoiceStatusData(chartData);
  };

  const fetchTopProducts = async () => {
    if (!companyId) return;

    const periodDays = parseInt(period);
    const startDate = subDays(new Date(), periodDays).toISOString();

    // Get invoice items with product info
    const { data: invoiceItems } = await supabase
      .from("invoice_items")
      .select(`
        quantity,
        total,
        product:products(name, company_id)
      `)
      .gte("created_at", startDate);

    // Filter by company and group by product
    const productStats: { [key: string]: { quantity: number; revenue: number } } = {};
    
    invoiceItems?.forEach((item: any) => {
      if (item.product && item.product.company_id === companyId) {
        const name = item.product.name;
        if (!productStats[name]) {
          productStats[name] = { quantity: 0, revenue: 0 };
        }
        productStats[name].quantity += item.quantity || 0;
        productStats[name].revenue += item.total || 0;
      }
    });

    const topProductsData = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopProducts(topProductsData);
  };

  const fetchTopCustomers = async () => {
    if (!companyId) return;

    const periodDays = parseInt(period);
    const startDate = subDays(new Date(), periodDays).toISOString();

    const { data } = await supabase
      .from("invoices")
      .select(`
        total,
        customer:customers(name)
      `)
      .eq("company_id", companyId)
      .gte("created_at", startDate)
      .not("customer_id", "is", null);

    // Group by customer
    const customerStats: { [key: string]: number } = {};
    data?.forEach((inv: any) => {
      if (inv.customer) {
        const name = inv.customer.name;
        customerStats[name] = (customerStats[name] || 0) + (inv.total || 0);
      }
    });

    const topCustomersData = Object.entries(customerStats)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    setTopCustomers(topCustomersData);
  };

  const fetchMonthlySales = async () => {
    if (!companyId) return;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date).toISOString();
      const end = endOfMonth(date).toISOString();
      const monthName = format(date, "MMM", { locale: ar });

      // Get sales for this month
      const { data: salesData } = await supabase
        .from("sales")
        .select("total")
        .eq("company_id", companyId)
        .gte("sale_date", start)
        .lte("sale_date", end);

      const salesTotal = salesData?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;

      // Get invoices for this month
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("total")
        .eq("company_id", companyId)
        .gte("created_at", start)
        .lte("created_at", end);

      const invoicesTotal = invoicesData?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;

      months.push({
        month: monthName,
        sales: salesTotal,
        invoices: invoicesTotal,
      });
    }

    setMonthlySalesData(months);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    growth,
    prefix = "",
    suffix = "",
  }: {
    title: string;
    value: number;
    icon: any;
    growth?: number;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {prefix}
              {value.toLocaleString()}
              {suffix}
            </p>
            {growth !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(growth)}%</span>
                <span className="text-muted-foreground">عن الفترة السابقة</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">التقارير</h1>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 3 أشهر</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">جاري التحميل...</div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="إجمالي المبيعات"
                  value={totalSales}
                  icon={DollarSign}
                  growth={salesGrowth}
                  suffix=" جنيه"
                />
                <StatCard
                  title="عدد الفواتير"
                  value={totalInvoices}
                  icon={FileText}
                  growth={invoicesGrowth}
                />
                <StatCard
                  title="عدد العملاء"
                  value={totalCustomers}
                  icon={Users}
                />
                <StatCard
                  title="عدد المنتجات"
                  value={totalProducts}
                  icon={Package}
                />
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>مبيعات الفترة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()} جنيه`, "المبيعات"]}
                          />
                          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>حالة الفواتير</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={invoiceStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>مقارنة المبيعات والفواتير الشهرية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlySalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} جنيه`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="المبيعات"
                        />
                        <Line
                          type="monotone"
                          dataKey="invoices"
                          stroke="#22c55e"
                          strokeWidth={2}
                          name="الفواتير"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Products & Customers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      أفضل المنتجات مبيعاً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topProducts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        لا توجد بيانات
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {topProducts.map((product, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.quantity} وحدة
                                </p>
                              </div>
                            </div>
                            <p className="font-bold">{product.revenue.toLocaleString()} جنيه</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Customers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      أفضل العملاء
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topCustomers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        لا توجد بيانات
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {topCustomers.map((customer, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {index + 1}
                              </span>
                              <p className="font-medium">{customer.name}</p>
                            </div>
                            <p className="font-bold">{customer.total.toLocaleString()} جنيه</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reports;
