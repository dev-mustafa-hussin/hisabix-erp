import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AreaChart,
  Area,
} from "recharts";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  quantity: number | null;
  min_quantity: number | null;
  selling_price: number | null;
  cost_price: number | null;
  category_id: string | null;
  is_active: boolean | null;
}

interface Category {
  id: string;
  name: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: string;
  created_at: string;
}

const InventoryReport = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("quantity_asc");

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    outOfStock: 0,
    lowStock: 0,
    healthyStock: 0,
    totalQuantity: 0,
    averagePrice: 0,
    profitMargin: 0,
  });

  // Chart data
  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; value: number; quantity: number }[]>([]);
  const [stockStatusData, setStockStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [movementTrend, setMovementTrend] = useState<{ date: string; in: number; out: number }[]>([]);
  const [topValueProducts, setTopValueProducts] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchAllData();
    }
  }, [companyId]);

  const fetchCompanyId = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCompanyId(data.company_id);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchStockMovements(),
    ]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    if (!companyId) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching products:", error);
      return;
    }

    setProducts(data || []);
    calculateStats(data || []);
  };

  const fetchCategories = async () => {
    if (!companyId) return;

    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("company_id", companyId);

    setCategories(data || []);
  };

  const fetchStockMovements = async () => {
    if (!companyId) return;

    const startDate = subDays(new Date(), 30).toISOString();

    const { data } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("company_id", companyId)
      .gte("created_at", startDate)
      .order("created_at", { ascending: true });

    setStockMovements(data || []);
    calculateMovementTrend(data || []);
  };

  const calculateStats = (productsData: Product[]) => {
    const outOfStock = productsData.filter(p => (p.quantity || 0) === 0).length;
    const lowStock = productsData.filter(p => 
      (p.quantity || 0) > 0 && 
      (p.quantity || 0) <= (p.min_quantity || 0) && 
      (p.min_quantity || 0) > 0
    ).length;
    const healthyStock = productsData.length - outOfStock - lowStock;

    const totalValue = productsData.reduce((sum, p) => 
      sum + ((p.quantity || 0) * (p.cost_price || 0)), 0
    );

    const totalQuantity = productsData.reduce((sum, p) => sum + (p.quantity || 0), 0);

    const averagePrice = productsData.length > 0
      ? productsData.reduce((sum, p) => sum + (p.selling_price || 0), 0) / productsData.length
      : 0;

    const totalCost = productsData.reduce((sum, p) => sum + (p.cost_price || 0), 0);
    const totalSelling = productsData.reduce((sum, p) => sum + (p.selling_price || 0), 0);
    const profitMargin = totalCost > 0 ? ((totalSelling - totalCost) / totalCost) * 100 : 0;

    setStats({
      totalProducts: productsData.length,
      totalValue,
      outOfStock,
      lowStock,
      healthyStock,
      totalQuantity,
      averagePrice,
      profitMargin,
    });

    // Stock status chart data
    setStockStatusData([
      { name: "مخزون صحي", value: healthyStock, color: "#22c55e" },
      { name: "مخزون منخفض", value: lowStock, color: "#eab308" },
      { name: "نفذ من المخزون", value: outOfStock, color: "#ef4444" },
    ]);

    // Category distribution
    const categoryStats: { [key: string]: { value: number; quantity: number } } = {};
    productsData.forEach(p => {
      const catId = p.category_id || "uncategorized";
      if (!categoryStats[catId]) {
        categoryStats[catId] = { value: 0, quantity: 0 };
      }
      categoryStats[catId].value += (p.quantity || 0) * (p.cost_price || 0);
      categoryStats[catId].quantity += p.quantity || 0;
    });

    // Top value products
    const topProducts = [...productsData]
      .map(p => ({
        name: p.name_ar || p.name,
        value: (p.quantity || 0) * (p.cost_price || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    setTopValueProducts(topProducts);
  };

  const calculateMovementTrend = (movements: StockMovement[]) => {
    const grouped: { [key: string]: { in: number; out: number } } = {};

    movements.forEach(m => {
      const date = format(new Date(m.created_at), "MM/dd");
      if (!grouped[date]) {
        grouped[date] = { in: 0, out: 0 };
      }
      if (m.movement_type === "in" || m.movement_type === "purchase" || m.movement_type === "adjustment_add") {
        grouped[date].in += m.quantity;
      } else {
        grouped[date].out += m.quantity;
      }
    });

    const trendData = Object.entries(grouped).map(([date, data]) => ({
      date,
      in: data.in,
      out: data.out,
    }));

    setMovementTrend(trendData);
  };

  const getFilteredProducts = () => {
    let filtered = [...products];

    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }

    switch (sortBy) {
      case "quantity_asc":
        filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
        break;
      case "quantity_desc":
        filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
        break;
      case "value_desc":
        filtered.sort((a, b) => 
          ((b.quantity || 0) * (b.cost_price || 0)) - ((a.quantity || 0) * (a.cost_price || 0))
        );
        break;
      case "name":
        filtered.sort((a, b) => (a.name_ar || a.name).localeCompare(b.name_ar || b.name));
        break;
    }

    return filtered;
  };

  const getStockStatus = (product: Product) => {
    if ((product.quantity || 0) === 0) {
      return { label: "نفذ", variant: "destructive" as const, icon: XCircle };
    }
    if ((product.quantity || 0) <= (product.min_quantity || 0) && (product.min_quantity || 0) > 0) {
      return { label: "منخفض", variant: "secondary" as const, icon: AlertTriangle, isWarning: true };
    }
    return { label: "متوفر", variant: "default" as const, icon: CheckCircle, isSuccess: true };
  };

  const handleExportExcel = () => {
    const exportData = products.map(p => ({
      "المنتج": p.name_ar || p.name,
      "الكمية": p.quantity || 0,
      "الحد الأدنى": p.min_quantity || 0,
      "سعر التكلفة": p.cost_price || 0,
      "سعر البيع": p.selling_price || 0,
      "قيمة المخزون": ((p.quantity || 0) * (p.cost_price || 0)),
      "الحالة": getStockStatus(p).label,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير المخزون");
    XLSX.writeFile(wb, `تقرير_المخزون_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("تم تصدير التقرير بنجاح");
  };

  const COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Sidebar />
        <Header />
        <main className="mr-64 pt-14 p-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />

      <main className="mr-64 pt-14 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير Excel
            </Button>
            <Button onClick={fetchAllData} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />
            تقرير المخزون الشامل
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">قيمة المخزون</p>
                  <p className="text-2xl font-bold">{stats.totalValue.toLocaleString()} ج.م</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">مخزون منخفض</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">نفذ من المخزون</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">إجمالي الكميات</p>
              <p className="text-xl font-bold">{stats.totalQuantity.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">متوسط سعر البيع</p>
              <p className="text-xl font-bold">{stats.averagePrice.toFixed(2)} ج.م</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">هامش الربح المتوقع</p>
              <p className="text-xl font-bold text-emerald-600">{stats.profitMargin.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">المخزون الصحي</p>
              <p className="text-xl font-bold text-emerald-600">{stats.healthyStock}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Stock Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">توزيع حالة المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Movement Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">حركة المخزون (آخر 30 يوم)</CardTitle>
            </CardHeader>
            <CardContent>
              {movementTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={movementTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="in" name="وارد" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="out" name="صادر" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  لا توجد حركات في الفترة المحددة
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Value Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أعلى 10 منتجات من حيث قيمة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topValueProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <ArrowUpDown className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantity_asc">الكمية (تصاعدي)</SelectItem>
                    <SelectItem value="quantity_desc">الكمية (تنازلي)</SelectItem>
                    <SelectItem value="value_desc">القيمة (تنازلي)</SelectItem>
                    <SelectItem value="name">الاسم</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="جميع الفئات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CardTitle className="text-right">تفاصيل المنتجات</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">قيمة المخزون</TableHead>
                  <TableHead className="text-center">سعر البيع</TableHead>
                  <TableHead className="text-center">سعر التكلفة</TableHead>
                  <TableHead className="text-center">الحد الأدنى</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredProducts().slice(0, 20).map(product => {
                  const status = getStockStatus(product);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="text-center">
                        <Badge 
                          variant={status.variant}
                          className={`gap-1 ${'isSuccess' in status && status.isSuccess ? "bg-emerald-500/20 text-emerald-600 border-0" : ""} ${'isWarning' in status && status.isWarning ? "bg-amber-500/20 text-amber-600 border-0" : ""}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {((product.quantity || 0) * (product.cost_price || 0)).toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="text-center">{(product.selling_price || 0).toLocaleString()} ج.م</TableCell>
                      <TableCell className="text-center">{(product.cost_price || 0).toLocaleString()} ج.م</TableCell>
                      <TableCell className="text-center">{product.min_quantity || 0}</TableCell>
                      <TableCell className={`text-center font-bold ${(product.quantity || 0) === 0 ? "text-red-600" : (product.quantity || 0) <= (product.min_quantity || 0) ? "text-amber-600" : ""}`}>
                        {product.quantity || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium">{product.name_ar || product.name}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {getFilteredProducts().length > 20 && (
              <p className="text-center text-muted-foreground mt-4">
                يتم عرض أول 20 منتج من أصل {getFilteredProducts().length}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InventoryReport;