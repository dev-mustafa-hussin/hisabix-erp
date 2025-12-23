import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Loader2,
  Box,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Mail,
  Edit,
  Save,
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CalendarIcon,
  Filter,
  RotateCcw,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  sku: string | null;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  selling_price: number;
  is_active: boolean;
  category?: {
    name: string;
  } | null;
}

interface StockMovementForm {
  product_id: string;
  quantity: number;
  type: "in" | "out";
  notes: string;
}

interface StockMovementRecord {
  id: string;
  product_id: string;
  user_id: string;
  movement_type: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  notes: string | null;
  created_at: string;
  product?: {
    name: string;
    name_ar: string | null;
  } | null;
}

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockMovement, setStockMovement] = useState<StockMovementForm>({
    product_id: "",
    quantity: 0,
    type: "in",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [editingMinQuantity, setEditingMinQuantity] = useState<string | null>(null);
  const [newMinQuantity, setNewMinQuantity] = useState<number>(0);
  const [companyData, setCompanyData] = useState<{ name: string; email: string | null } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Movement filters
  const [movementDateFrom, setMovementDateFrom] = useState<Date | undefined>(undefined);
  const [movementDateTo, setMovementDateTo] = useState<Date | undefined>(undefined);
  const [movementProductFilter, setMovementProductFilter] = useState<string>("all");
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setCompanyId(data.company_id);
        
        // Fetch company details
        const { data: company } = await supabase
          .from("companies")
          .select("name, email")
          .eq("id", data.company_id)
          .maybeSingle();
        
        if (company) {
          setCompanyData(company);
        }
      }
    };

    fetchCompanyId();
  }, [user?.id]);

  useEffect(() => {
    if (companyId) {
      fetchProducts();
      fetchStockMovements();
    }
  }, [companyId]);

  const fetchStockMovements = async () => {
    if (!companyId) return;

    setLoadingMovements(true);
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*, product:products(name, name_ar)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching movements:", error);
    } else {
      setStockMovements(data || []);
    }
    setLoadingMovements(false);
  };

  const fetchProducts = async () => {
    if (!companyId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("company_id", companyId)
      .order("name");

    if (error) {
      toast.error("فشل في تحميل المنتجات");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleStockMovement = async () => {
    if (!selectedProduct || stockMovement.quantity <= 0 || !user?.id || !companyId) {
      toast.error("يرجى إدخال كمية صحيحة");
      return;
    }

    setSaving(true);

    const quantityBefore = selectedProduct.quantity;
    const newQuantity =
      stockMovement.type === "in"
        ? selectedProduct.quantity + stockMovement.quantity
        : selectedProduct.quantity - stockMovement.quantity;

    if (newQuantity < 0) {
      toast.error("الكمية المخرجة أكبر من المتاح");
      setSaving(false);
      return;
    }

    // Update product quantity
    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: newQuantity })
      .eq("id", selectedProduct.id);

    if (updateError) {
      toast.error("فشل في تحديث المخزون");
      setSaving(false);
      return;
    }

    // Record the movement
    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        company_id: companyId,
        product_id: selectedProduct.id,
        user_id: user.id,
        movement_type: stockMovement.type,
        quantity: stockMovement.quantity,
        quantity_before: quantityBefore,
        quantity_after: newQuantity,
        notes: stockMovement.notes || null,
      });

    setSaving(false);

    if (movementError) {
      console.error("Error recording movement:", movementError);
      // Still show success since the quantity was updated
    }

    toast.success(
      stockMovement.type === "in"
        ? "تم إضافة الكمية بنجاح"
        : "تم سحب الكمية بنجاح"
    );
    setIsStockDialogOpen(false);
    setSelectedProduct(null);
    setStockMovement({ product_id: "", quantity: 0, type: "in", notes: "" });
    fetchProducts();
    fetchStockMovements();
  };

  const openStockDialog = (product: Product, type: "in" | "out") => {
    setSelectedProduct(product);
    setStockMovement({
      product_id: product.id,
      quantity: 0,
      type,
      notes: "",
    });
    setIsStockDialogOpen(true);
  };

  const handleSendStockAlert = async () => {
    if (!companyId || !companyData?.email) {
      toast.error("يرجى إضافة بريد إلكتروني للشركة في الإعدادات");
      return;
    }

    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
      toast.info("لا توجد منتجات تحتاج تنبيه");
      return;
    }

    setSendingAlert(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-stock-alert", {
        body: {
          company_id: companyId,
          recipient_email: companyData.email,
          company_name: companyData.name,
        },
      });

      if (error) throw error;

      toast.success(`تم إرسال تنبيه المخزون إلى ${companyData.email}`);
    } catch (error: any) {
      console.error("Error sending stock alert:", error);
      toast.error("فشل في إرسال تنبيه المخزون");
    } finally {
      setSendingAlert(false);
    }
  };

  const handleUpdateMinQuantity = async (productId: string) => {
    if (newMinQuantity < 0) {
      toast.error("الحد الأدنى يجب أن يكون 0 أو أكثر");
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({ min_quantity: newMinQuantity })
      .eq("id", productId);

    if (error) {
      toast.error("فشل في تحديث الحد الأدنى");
    } else {
      toast.success("تم تحديث الحد الأدنى");
      setEditingMinQuantity(null);
      fetchProducts();
    }
  };

  const startEditingMinQuantity = (product: Product) => {
    setEditingMinQuantity(product.id);
    setNewMinQuantity(product.min_quantity);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId || !user?.id) return;

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("الملف فارغ أو لا يحتوي على بيانات صالحة");
        setImporting(false);
        return;
      }

      const productsToInsert = jsonData.map((row: any) => ({
        company_id: companyId,
        name: row["اسم المنتج"] || row["name"] || row["Name"] || row["المنتج"] || "",
        name_ar: row["الاسم بالعربي"] || row["name_ar"] || null,
        sku: row["SKU"] || row["sku"] || row["رمز المنتج"] || null,
        barcode: row["الباركود"] || row["barcode"] || row["Barcode"] || null,
        cost_price: parseFloat(row["سعر التكلفة"] || row["cost_price"] || row["Cost Price"] || 0),
        selling_price: parseFloat(row["سعر البيع"] || row["selling_price"] || row["Selling Price"] || 0),
        quantity: parseInt(row["الكمية"] || row["quantity"] || row["Quantity"] || 0),
        min_quantity: parseInt(row["الحد الأدنى"] || row["min_quantity"] || row["Min Quantity"] || 0),
        unit: row["الوحدة"] || row["unit"] || row["Unit"] || "piece",
        description: row["الوصف"] || row["description"] || row["Description"] || null,
        is_active: true,
      }));

      // Filter out products without a name
      const validProducts = productsToInsert.filter((p) => p.name && p.name.trim() !== "");

      if (validProducts.length === 0) {
        toast.error("لا توجد منتجات صالحة للاستيراد");
        setImporting(false);
        return;
      }

      const { error } = await supabase.from("products").insert(validProducts);

      if (error) {
        console.error("Error importing products:", error);
        toast.error("فشل في استيراد المنتجات");
      } else {
        toast.success(`تم استيراد ${validProducts.length} منتج بنجاح`);
        fetchProducts();
      }
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("فشل في قراءة الملف");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "اسم المنتج": "منتج مثال",
        "الاسم بالعربي": "منتج مثال",
        "رمز المنتج": "SKU001",
        "الباركود": "1234567890123",
        "سعر التكلفة": 100,
        "سعر البيع": 150,
        "الكمية": 50,
        "الحد الأدنى": 10,
        "الوحدة": "piece",
        "الوصف": "وصف المنتج",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات");
    XLSX.writeFile(workbook, "قالب_استيراد_المنتجات.xlsx");
  };

  const exportToExcel = () => {
    if (products.length === 0) {
      toast.error("لا توجد منتجات للتصدير");
      return;
    }

    const exportData = products.map((product) => ({
      "اسم المنتج": product.name,
      "الاسم بالعربي": product.name_ar || "",
      "رمز المنتج": product.sku || "",
      "التصنيف": product.category?.name || "",
      "سعر التكلفة": product.cost_price,
      "سعر البيع": product.selling_price,
      "الكمية": product.quantity,
      "الحد الأدنى": product.min_quantity,
      "قيمة المخزون": product.quantity * product.cost_price,
      "الحالة": product.quantity === 0 ? "نفذ" : product.quantity <= product.min_quantity ? "منخفض" : "متوفر",
      "نشط": product.is_active ? "نعم" : "لا",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المخزون");
    
    const date = new Date().toLocaleDateString("ar-EG").replace(/\//g, "-");
    XLSX.writeFile(workbook, `تقرير_المخزون_${date}.xlsx`);
    toast.success("تم تصدير المخزون بنجاح");
  };

  const exportMovementsToExcel = (movementsToExport: StockMovementRecord[]) => {
    if (movementsToExport.length === 0) {
      toast.error("لا توجد حركات للتصدير");
      return;
    }

    const exportData = movementsToExport.map((movement) => ({
      "التاريخ": format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ar }),
      "المنتج": movement.product?.name_ar || movement.product?.name || "-",
      "نوع الحركة": movement.movement_type === "in" ? "إضافة" : "سحب",
      "الكمية": movement.quantity,
      "الكمية قبل": movement.quantity_before,
      "الكمية بعد": movement.quantity_after,
      "ملاحظات": movement.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "حركات المخزون");
    
    const date = new Date().toLocaleDateString("ar-EG").replace(/\//g, "-");
    XLSX.writeFile(workbook, `سجل_حركات_المخزون_${date}.xlsx`);
    toast.success("تم تصدير سجل الحركات بنجاح");
  };

  // Statistics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.quantity <= p.min_quantity && p.quantity > 0
  );
  const outOfStockProducts = products.filter((p) => p.quantity === 0);
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + p.quantity * p.cost_price,
    0
  );

  // Filter products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name_ar?.includes(searchTerm) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter movements
  const filteredMovements = stockMovements.filter((movement) => {
    // Date filter
    const movementDate = new Date(movement.created_at);
    if (movementDateFrom && movementDate < startOfDay(movementDateFrom)) {
      return false;
    }
    if (movementDateTo && movementDate > endOfDay(movementDateTo)) {
      return false;
    }

    // Product filter
    if (movementProductFilter !== "all" && movement.product_id !== movementProductFilter) {
      return false;
    }

    // Type filter
    if (movementTypeFilter !== "all" && movement.movement_type !== movementTypeFilter) {
      return false;
    }

    return true;
  });

  const resetMovementFilters = () => {
    setMovementDateFrom(undefined);
    setMovementDateTo(undefined);
    setMovementProductFilter("all");
    setMovementTypeFilter("all");
  };

  const hasActiveFilters = movementDateFrom || movementDateTo || movementProductFilter !== "all" || movementTypeFilter !== "all";

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          نفذ
        </Badge>
      );
    }
    if (product.quantity <= product.min_quantity) {
      return (
        <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-600">
          <TrendingDown className="w-3 h-3" />
          منخفض
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-emerald-500/20 text-emerald-600">
        <TrendingUp className="w-3 h-3" />
        متوفر
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />

      <main className="mr-64 pt-14 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في المخزون..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="gap-2"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              استيراد Excel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2 text-muted-foreground"
            >
              <Download className="w-4 h-4" />
              تحميل القالب
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              تصدير Excel
            </Button>
          </div>
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            إدارة المخزون
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <Box className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيمة المخزون</p>
                  <p className="text-2xl font-bold">
                    {totalInventoryValue.toLocaleString()} EGP
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مخزون منخفض</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {lowStockProducts.length}
                  </p>
                </div>
                <TrendingDown className="w-10 h-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نفذ من المخزون</p>
                  <p className="text-2xl font-bold text-destructive">
                    {outOfStockProducts.length}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendStockAlert}
                  disabled={sendingAlert}
                  className="gap-2"
                >
                  {sendingAlert ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  إرسال تنبيه بالبريد
                </Button>
                <CardTitle className="flex items-center gap-2 text-amber-600 text-right">
                  <AlertTriangle className="w-5 h-5" />
                  تنبيهات المخزون
                </CardTitle>
              </div>
              <CardDescription className="text-right">
                المنتجات التي تحتاج إلى إعادة تعبئة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {outOfStockProducts.map((product) => (
                  <Badge
                    key={product.id}
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => openStockDialog(product, "in")}
                  >
                    {product.name} (نفذ)
                  </Badge>
                ))}
                {lowStockProducts.map((product) => (
                  <Badge
                    key={product.id}
                    variant="secondary"
                    className="bg-amber-500/20 text-amber-600 cursor-pointer"
                    onClick={() => openStockDialog(product, "in")}
                  >
                    {product.name} ({product.quantity} متبقي)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Inventory and Movements */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mr-auto">
            <TabsTrigger value="movements" className="gap-2">
              <History className="w-4 h-4" />
              سجل الحركات
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4" />
              جرد المخزون
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">جرد المخزون</CardTitle>
                <CardDescription className="text-right">
                  قائمة بجميع المنتجات وكمياتها
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد منتجات</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">SKU</TableHead>
                        <TableHead className="text-right">التصنيف</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">الحد الأدنى</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="text-right">سعر التكلفة</TableHead>
                        <TableHead className="text-right">قيمة المخزون</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow
                          key={product.id}
                          className={
                            product.quantity === 0
                              ? "bg-destructive/5"
                              : product.quantity <= product.min_quantity
                              ? "bg-amber-500/5"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {product.name_ar || product.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.sku || "-"}
                          </TableCell>
                          <TableCell>{product.category?.name || "-"}</TableCell>
                          <TableCell className="text-center font-bold">
                            {product.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingMinQuantity === product.id ? (
                              <div className="flex items-center gap-1 justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  value={newMinQuantity}
                                  onChange={(e) => setNewMinQuantity(parseInt(e.target.value) || 0)}
                                  className="w-16 h-7 text-center text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-emerald-600"
                                  onClick={() => handleUpdateMinQuantity(product.id)}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground"
                                  onClick={() => setEditingMinQuantity(null)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditingMinQuantity(product)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 justify-center w-full"
                                title="انقر للتعديل"
                              >
                                {product.min_quantity}
                                <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStockStatus(product)}
                          </TableCell>
                          <TableCell>{product.cost_price.toFixed(2)} EGP</TableCell>
                          <TableCell>
                            {(product.quantity * product.cost_price).toFixed(2)} EGP
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openStockDialog(product, "in")}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                title="إضافة للمخزون"
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openStockDialog(product, "out")}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                                title="سحب من المخزون"
                                disabled={product.quantity === 0}
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportMovementsToExcel(filteredMovements)}
                    className="gap-2"
                    disabled={filteredMovements.length === 0}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    تصدير Excel
                  </Button>
                  <CardTitle className="text-right flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    سجل حركات المخزون
                  </CardTitle>
                </div>
                <CardDescription className="text-right">
                  جميع عمليات الإضافة والسحب من المخزون
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">فلترة:</span>
                  </div>

                  {/* Date From */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "gap-2 w-[140px] justify-start",
                          !movementDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="w-4 h-4" />
                        {movementDateFrom ? format(movementDateFrom, "dd/MM/yyyy") : "من تاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={movementDateFrom}
                        onSelect={setMovementDateFrom}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Date To */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "gap-2 w-[140px] justify-start",
                          !movementDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="w-4 h-4" />
                        {movementDateTo ? format(movementDateTo, "dd/MM/yyyy") : "إلى تاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={movementDateTo}
                        onSelect={setMovementDateTo}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Product Filter */}
                  <Select value={movementProductFilter} onValueChange={setMovementProductFilter}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المنتجات</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name_ar || product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Type Filter */}
                  <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="in">إضافة</SelectItem>
                      <SelectItem value="out">سحب</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Reset Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetMovementFilters}
                      className="gap-1 text-muted-foreground"
                    >
                      <RotateCcw className="w-3 h-3" />
                      إعادة تعيين
                    </Button>
                  )}

                  {hasActiveFilters && (
                    <Badge variant="secondary" className="mr-auto">
                      {filteredMovements.length} نتيجة
                    </Badge>
                  )}
                </div>

                {loadingMovements ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredMovements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{hasActiveFilters ? "لا توجد نتائج مطابقة للفلتر" : "لا توجد حركات مسجلة"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-center">النوع</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">قبل</TableHead>
                        <TableHead className="text-center">بعد</TableHead>
                        <TableHead className="text-right">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ar,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {movement.product?.name_ar || movement.product?.name || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {movement.movement_type === "in" ? (
                              <Badge className="gap-1 bg-emerald-500/20 text-emerald-600 border-0">
                                <ArrowUpCircle className="w-3 h-3" />
                                إضافة
                              </Badge>
                            ) : (
                              <Badge className="gap-1 bg-amber-500/20 text-amber-600 border-0">
                                <ArrowDownCircle className="w-3 h-3" />
                                سحب
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {movement.movement_type === "in" ? "+" : "-"}
                            {movement.quantity}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {movement.quantity_before}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {movement.quantity_after}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {movement.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Stock Movement Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              {stockMovement.type === "in" ? (
                <>
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                  إضافة للمخزون
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-5 h-5 text-amber-600" />
                  سحب من المخزون
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">المنتج</p>
              <p className="font-bold">{selectedProduct?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                الكمية الحالية:{" "}
                <span className="font-bold">{selectedProduct?.quantity}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input
                type="number"
                min="1"
                value={stockMovement.quantity || ""}
                onChange={(e) =>
                  setStockMovement({
                    ...stockMovement,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                placeholder={
                  stockMovement.type === "in" ? "كمية الإضافة" : "كمية السحب"
                }
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input
                value={stockMovement.notes}
                onChange={(e) =>
                  setStockMovement({ ...stockMovement, notes: e.target.value })
                }
                placeholder="سبب التعديل..."
              />
            </div>

            {stockMovement.quantity > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">الكمية الجديدة</p>
                <p className="font-bold text-lg">
                  {stockMovement.type === "in"
                    ? (selectedProduct?.quantity || 0) + stockMovement.quantity
                    : (selectedProduct?.quantity || 0) - stockMovement.quantity}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsStockDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleStockMovement}
                disabled={saving || stockMovement.quantity <= 0}
                className={
                  stockMovement.type === "in"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : stockMovement.type === "in" ? (
                  "إضافة"
                ) : (
                  "سحب"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
