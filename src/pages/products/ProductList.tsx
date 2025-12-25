import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Loader2,
  BarChart,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  sku: string | null;
  barcode: string | null;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  unit: string;
  is_active: boolean;
  description: string | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    sku: "",
    barcode: "",
    cost_price: "0",
    selling_price: "0",
    quantity: "0",
    min_quantity: "0",
    unit: "قطعة",
    description: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المنتجات",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      sku: "",
      barcode: "",
      cost_price: "0",
      selling_price: "0",
      quantity: "0",
      min_quantity: "0",
      unit: "قطعة",
      description: "",
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        name_ar: product.name_ar || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        cost_price: String(product.cost_price || 0),
        selling_price: String(product.selling_price || 0),
        quantity: String(product.quantity || 0),
        min_quantity: String(product.min_quantity || 0),
        unit: product.unit || "قطعة",
        description: product.description || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المنتج",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    // Get the user's company
    const { data: companyUsers } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user?.id)
      .limit(1);

    const companyId = companyUsers?.[0]?.company_id;

    if (!companyId) {
      toast({
        title: "خطأ",
        description: "يرجى إنشاء شركة أولاً",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const productData = {
      name: formData.name.trim(),
      name_ar: formData.name_ar.trim() || null,
      sku: formData.sku.trim() || null,
      barcode: formData.barcode.trim() || null,
      cost_price: parseFloat(formData.cost_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      min_quantity: parseInt(formData.min_quantity) || 0,
      unit: formData.unit.trim() || "قطعة",
      description: formData.description.trim() || null,
      company_id: companyId,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل في تحديث المنتج",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم التحديث",
          description: "تم تحديث المنتج بنجاح",
        });
        fetchProducts();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("products").insert(productData);

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل في إضافة المنتج",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تمت الإضافة",
          description: "تم إضافة المنتج بنجاح",
        });
        fetchProducts();
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteProduct.id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح",
      });
      fetchProducts();
    }
    setDeleteProduct(null);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
  );

  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">نفذ</Badge>;
    }
    if (quantity <= minQuantity) {
      return (
        <Badge
          variant="secondary"
          className="bg-warning text-warning-foreground"
        >
          منخفض
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-500">
        متوفر
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <h1 className="text-xl font-bold text-card-foreground hidden sm:flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            إدارة المنتجات
          </h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="gap-2 w-full sm:w-auto order-first sm:order-last"
            >
              <Plus className="w-4 h-4" />
              إضافة منتج
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label>اسم المنتج (إنجليزي) *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Product Name"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label>اسم المنتج (عربي)</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, name_ar: e.target.value })
                    }
                    placeholder="اسم المنتج"
                    className="text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label>رمز المنتج (SKU)</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="SKU-001"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label>الباركود</Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="123456789"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label>سعر التكلفة</Label>
                  <Input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_price: e.target.value })
                    }
                    placeholder="0"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label>سعر البيع</Label>
                  <Input
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selling_price: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2 text-right">
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="0"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label>الحد الأدنى</Label>
                  <Input
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, min_quantity: e.target.value })
                    }
                    placeholder="0"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2 text-right col-span-2 sm:col-span-1">
                  <Label>الوحدة</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="قطعة"
                    className="text-right"
                  />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label>الوصف</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="وصف المنتج"
                  className="text-right"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingProduct ? (
                    "تحديث"
                  ) : (
                    "إضافة"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <Package className="w-8 h-8 text-primary" />
            <div className="text-left">
              <p className="text-2xl font-bold text-card-foreground">
                {products.length}
              </p>
              <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <BarChart className="w-8 h-8 text-green-500" />
            <div className="text-left">
              <p className="text-2xl font-bold text-card-foreground">
                {products.filter((p) => p.quantity > p.min_quantity).length}
              </p>
              <p className="text-sm text-muted-foreground">متوفر</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <BarChart className="w-8 h-8 text-warning" />
            <div className="text-left">
              <p className="text-2xl font-bold text-card-foreground">
                {
                  products.filter(
                    (p) => p.quantity > 0 && p.quantity <= p.min_quantity
                  ).length
                }
              </p>
              <p className="text-sm text-muted-foreground">مخزون منخفض</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <BarChart className="w-8 h-8 text-destructive" />
            <div className="text-left">
              <p className="text-2xl font-bold text-card-foreground">
                {products.filter((p) => p.quantity === 0).length}
              </p>
              <p className="text-sm text-muted-foreground">نفذ المخزون</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mb-4" />
            <p>لا يوجد منتجات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">اسم المنتج</TableHead>
                  <TableHead className="text-right">SKU</TableHead>
                  <TableHead className="text-right">سعر التكلفة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {product.name_ar || product.name}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {product.sku || "-"}
                    </TableCell>
                    <TableCell>{product.cost_price} ج.م</TableCell>
                    <TableCell>{product.selling_price} ج.م</TableCell>
                    <TableCell>
                      {product.quantity} {product.unit}
                    </TableCell>
                    <TableCell>
                      {getStockStatus(product.quantity, product.min_quantity)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(product)}
                          className="hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteProduct(product)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المنتج "{deleteProduct?.name_ar || deleteProduct?.name}"
              نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Products;
