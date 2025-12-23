import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Edit,
  Loader2,
  Box,
  ArrowUpCircle,
  ArrowDownCircle,
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

interface StockMovement {
  product_id: string;
  quantity: number;
  type: "in" | "out";
  notes: string;
}

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockMovement, setStockMovement] = useState<StockMovement>({
    product_id: "",
    quantity: 0,
    type: "in",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

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
      }
    };

    fetchCompanyId();
  }, [user?.id]);

  useEffect(() => {
    if (companyId) {
      fetchProducts();
    }
  }, [companyId]);

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
    if (!selectedProduct || stockMovement.quantity <= 0) {
      toast.error("يرجى إدخال كمية صحيحة");
      return;
    }

    setSaving(true);

    const newQuantity =
      stockMovement.type === "in"
        ? selectedProduct.quantity + stockMovement.quantity
        : selectedProduct.quantity - stockMovement.quantity;

    if (newQuantity < 0) {
      toast.error("الكمية المخرجة أكبر من المتاح");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({ quantity: newQuantity })
      .eq("id", selectedProduct.id);

    setSaving(false);

    if (error) {
      toast.error("فشل في تحديث المخزون");
    } else {
      toast.success(
        stockMovement.type === "in"
          ? "تم إضافة الكمية بنجاح"
          : "تم سحب الكمية بنجاح"
      );
      setIsStockDialogOpen(false);
      setSelectedProduct(null);
      setStockMovement({ product_id: "", quantity: 0, type: "in", notes: "" });
      fetchProducts();
    }
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
          <div className="relative w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المخزون..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
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
              <CardTitle className="flex items-center gap-2 text-amber-600 text-right">
                <AlertTriangle className="w-5 h-5" />
                تنبيهات المخزون
              </CardTitle>
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

        {/* Products Table */}
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
                      <TableCell className="text-center text-muted-foreground">
                        {product.min_quantity}
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
