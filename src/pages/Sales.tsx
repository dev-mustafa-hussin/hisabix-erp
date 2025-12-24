import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Store, Eye } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Sale {
  id: string;
  sale_date: string;
  customer_id: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
  customer?: {
    name: string;
  } | null;
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
}

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const Sales = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(14);
  const [notes, setNotes] = useState<string>("");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  // Add item state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  useEffect(() => {
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchSales();
      fetchCustomers();
      fetchProducts();
    }
  }, [companyId]);

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

  const fetchSales = async () => {
    if (!companyId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(name)
      `)
      .eq("company_id", companyId)
      .order("sale_date", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
      toast.error("حدث خطأ في جلب بيانات المبيعات");
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    if (!companyId) return;

    const { data, error } = await supabase
      .from("customers")
      .select("id, name")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error fetching customers:", error);
    } else {
      setCustomers(data || []);
    }
  };

  const fetchProducts = async () => {
    if (!companyId) return;

    const { data, error } = await supabase
      .from("products")
      .select("id, name, selling_price, quantity")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setPaymentMethod("cash");
    setDiscountAmount(0);
    setTaxRate(14);
    setNotes("");
    setSaleItems([]);
    setSelectedProductId("");
    setItemQuantity(1);
  };

  const addItem = () => {
    if (!selectedProductId || itemQuantity <= 0) {
      toast.error("يرجى اختيار منتج وكمية صحيحة");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (itemQuantity > product.quantity) {
      toast.error("الكمية المطلوبة أكبر من المتوفرة في المخزن");
      return;
    }

    const existingItem = saleItems.find((item) => item.product_id === selectedProductId);
    if (existingItem) {
      toast.error("هذا المنتج موجود بالفعل في القائمة");
      return;
    }

    const newItem: SaleItem = {
      product_id: selectedProductId,
      product_name: product.name,
      quantity: itemQuantity,
      unit_price: product.selling_price || 0,
      total: itemQuantity * (product.selling_price || 0),
    };

    setSaleItems([...saleItems, newItem]);
    setSelectedProductId("");
    setItemQuantity(1);
  };

  const removeItem = (productId: string) => {
    setSaleItems(saleItems.filter((item) => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
    const total = subtotal - discountAmount + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async () => {
    if (!companyId || !user) return;

    if (saleItems.length === 0) {
      toast.error("يرجى إضافة منتج واحد على الأقل");
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals();

    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert({
        company_id: companyId,
        user_id: user.id,
        customer_id: customerId || null,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        payment_method: paymentMethod as "cash" | "card" | "bank_transfer" | "check",
        notes: notes || null,
        sale_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (saleError) {
      console.error("Error creating sale:", saleError);
      toast.error("حدث خطأ في إنشاء عملية البيع");
      return;
    }

    // Update product quantities
    for (const item of saleItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        await supabase
          .from("products")
          .update({ quantity: product.quantity - item.quantity })
          .eq("id", item.product_id);
      }
    }

    toast.success("تم تسجيل عملية البيع بنجاح");
    setIsDialogOpen(false);
    resetForm();
    fetchSales();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف عملية البيع؟")) return;

    const { error } = await supabase.from("sales").delete().eq("id", id);

    if (error) {
      console.error("Error deleting sale:", error);
      toast.error("حدث خطأ في حذف عملية البيع");
    } else {
      toast.success("تم حذف عملية البيع بنجاح");
      fetchSales();
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "نقداً";
      case "credit_card":
        return "بطاقة ائتمان";
      case "bank_transfer":
        return "تحويل بنكي";
      case "check":
        return "شيك";
      default:
        return method;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <DashboardLayout>
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">المبيعات</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 ml-2" />
                  عملية بيع جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>عملية بيع جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Customer Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>العميل (اختياري)</Label>
                      <Select value={customerId} onValueChange={setCustomerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>طريقة الدفع</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">نقداً</SelectItem>
                          <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                          <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                          <SelectItem value="check">شيك</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Add Product */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">إضافة منتج</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>المنتج</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنتج" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.selling_price} جنيه (متوفر: {product.quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>الكمية</Label>
                        <Input
                          type="number"
                          min="1"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" onClick={addItem} className="w-full">
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  {saleItems.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>سعر الوحدة</TableHead>
                            <TableHead>الإجمالي</TableHead>
                            <TableHead>إجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {saleItems.map((item) => (
                            <TableRow key={item.product_id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.unit_price} جنيه</TableCell>
                              <TableCell>{item.total} جنيه</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.product_id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الخصم</Label>
                      <Input
                        type="number"
                        min="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نسبة الضريبة (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{subtotal.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الخصم:</span>
                      <span>-{discountAmount.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة ({taxRate}%):</span>
                      <span>{taxAmount.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>الإجمالي:</span>
                      <span>{total.toFixed(2)} جنيه</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>ملاحظات</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleSubmit}>تسجيل عملية البيع</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sales Table */}
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد عمليات بيع
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell>{sale.customer?.name || "عميل نقدي"}</TableCell>
                      <TableCell>{sale.total?.toFixed(2)} جنيه</TableCell>
                      <TableCell>{getPaymentMethodLabel(sale.payment_method)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(sale.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* View Sale Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تفاصيل عملية البيع</DialogTitle>
              </DialogHeader>
              {selectedSale && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">التاريخ</Label>
                      <p>
                        {format(new Date(selectedSale.sale_date), "dd/MM/yyyy HH:mm", {
                          locale: ar,
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">العميل</Label>
                      <p>{selectedSale.customer?.name || "عميل نقدي"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">طريقة الدفع</Label>
                      <p>{getPaymentMethodLabel(selectedSale.payment_method)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">المجموع الفرعي</Label>
                      <p>{selectedSale.subtotal?.toFixed(2)} جنيه</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">الخصم</Label>
                      <p>{selectedSale.discount_amount?.toFixed(2)} جنيه</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">الضريبة</Label>
                      <p>{selectedSale.tax_amount?.toFixed(2)} جنيه</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>الإجمالي:</span>
                      <span>{selectedSale.total?.toFixed(2)} جنيه</span>
                    </div>
                  </div>
                  {selectedSale.notes && (
                    <div>
                      <Label className="text-muted-foreground">ملاحظات</Label>
                      <p>{selectedSale.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Sales;
