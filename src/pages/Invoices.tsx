import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Eye, Printer } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  customer_id: string | null;
  subtotal: number;
  discount_rate: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  status: string;
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

interface InvoiceItem {
  id?: string;
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  tax_rate: number;
  total: number;
}

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState<string>("");
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(14);
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Add item state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemDescription, setItemDescription] = useState<string>("");

  useEffect(() => {
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchInvoices();
      fetchCustomers();
      fetchProducts();
      generateInvoiceNumber();
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

  const fetchInvoices = async () => {
    if (!companyId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        customer:customers(name)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      toast.error("حدث خطأ في جلب الفواتير");
    } else {
      setInvoices(data || []);
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

  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    const nextNumber = (count || 0) + 1;
    setInvoiceNumber(`INV-${year}-${String(nextNumber).padStart(4, "0")}`);
  };

  const resetForm = () => {
    generateInvoiceNumber();
    setCustomerId("");
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
    setDueDate("");
    setDiscountRate(0);
    setTaxRate(14);
    setNotes("");
    setItems([]);
    setSelectedProductId("");
    setItemQuantity(1);
    setItemDescription("");
  };

  const addItem = () => {
    if (!selectedProductId || itemQuantity <= 0) {
      toast.error("يرجى اختيار منتج وكمية صحيحة");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const existingItem = items.find((item) => item.product_id === selectedProductId);
    if (existingItem) {
      toast.error("هذا المنتج موجود بالفعل في القائمة");
      return;
    }

    const itemTotal = itemQuantity * (product.selling_price || 0);
    const newItem: InvoiceItem = {
      product_id: selectedProductId,
      product_name: product.name,
      description: itemDescription || product.name,
      quantity: itemQuantity,
      unit_price: product.selling_price || 0,
      discount_rate: 0,
      tax_rate: taxRate,
      total: itemTotal,
    };

    setItems([...items, newItem]);
    setSelectedProductId("");
    setItemQuantity(1);
    setItemDescription("");
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discountRate) / 100;
    const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
    const total = subtotal - discountAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleSubmit = async () => {
    if (!companyId || !user) return;

    if (items.length === 0) {
      toast.error("يرجى إضافة منتج واحد على الأقل");
      return;
    }

    const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        company_id: companyId,
        user_id: user.id,
        invoice_number: invoiceNumber,
        customer_id: customerId || null,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        subtotal,
        discount_rate: discountRate,
        discount_amount: discountAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        paid_amount: 0,
        status: "draft",
        notes: notes || null,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      toast.error("حدث خطأ في إنشاء الفاتورة");
      return;
    }

    // Insert invoice items
    const invoiceItemsData = items.map((item) => ({
      invoice_id: invoiceData.id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_rate: item.discount_rate,
      tax_rate: item.tax_rate,
      total: item.total,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItemsData);

    if (itemsError) {
      console.error("Error creating invoice items:", itemsError);
      toast.error("حدث خطأ في إضافة بنود الفاتورة");
      return;
    }

    toast.success("تم إنشاء الفاتورة بنجاح");
    setIsDialogOpen(false);
    resetForm();
    fetchInvoices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الفاتورة؟")) return;

    // Delete invoice items first
    await supabase.from("invoice_items").delete().eq("invoice_id", id);

    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) {
      console.error("Error deleting invoice:", error);
      toast.error("حدث خطأ في حذف الفاتورة");
    } else {
      toast.success("تم حذف الفاتورة بنجاح");
      fetchInvoices();
    }
  };

  const handleStatusChange = async (id: string, newStatus: "draft" | "sent" | "paid" | "overdue" | "cancelled") => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("حدث خطأ في تحديث الحالة");
    } else {
      toast.success("تم تحديث حالة الفاتورة");
      fetchInvoices();
    }
  };

  const fetchInvoiceItems = async (invoiceId: string) => {
    const { data, error } = await supabase
      .from("invoice_items")
      .select(`
        *,
        product:products(name)
      `)
      .eq("invoice_id", invoiceId);

    if (error) {
      console.error("Error fetching invoice items:", error);
    } else {
      setInvoiceItems(data?.map(item => ({
        ...item,
        product_name: item.product?.name || item.description,
      })) || []);
    }
  };

  const viewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    await fetchInvoiceItems(invoice.id);
    setIsViewDialogOpen(true);
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">مسودة</Badge>;
      case "sent":
        return <Badge variant="outline">مرسلة</Badge>;
      case "paid":
        return <Badge className="bg-green-500">مدفوعة</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">مدفوعة جزئياً</Badge>;
      case "overdue":
        return <Badge variant="destructive">متأخرة</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">الفواتير</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 ml-2" />
                  فاتورة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Invoice Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الفاتورة</Label>
                      <Input value={invoiceNumber} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>العميل</Label>
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
                      <Label>تاريخ الفاتورة</Label>
                      <Input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ الاستحقاق</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Add Product */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">إضافة منتج</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>المنتج</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنتج" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.selling_price} جنيه
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>الوصف</Label>
                        <Input
                          value={itemDescription}
                          onChange={(e) => setItemDescription(e.target.value)}
                          placeholder="وصف البند"
                        />
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
                  {items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الوصف</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>سعر الوحدة</TableHead>
                            <TableHead>الإجمالي</TableHead>
                            <TableHead>إجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.product_id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.description}</TableCell>
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
                      <Label>نسبة الخصم (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
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
                      <span>الخصم ({discountRate}%):</span>
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
                    <Button onClick={handleSubmit}>إنشاء الفاتورة</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Invoices Table */}
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد فواتير
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoice_date), "dd/MM/yyyy", { locale: ar })}
                      </TableCell>
                      <TableCell>{invoice.customer?.name || "-"}</TableCell>
                      <TableCell>{invoice.total?.toFixed(2)} جنيه</TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => handleStatusChange(invoice.id, value as "draft" | "sent" | "paid" | "overdue" | "cancelled")}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>{getStatusBadge(invoice.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">مسودة</SelectItem>
                            <SelectItem value="sent">مرسلة</SelectItem>
                            <SelectItem value="paid">مدفوعة</SelectItem>
                            <SelectItem value="partial">مدفوعة جزئياً</SelectItem>
                            <SelectItem value="overdue">متأخرة</SelectItem>
                            <SelectItem value="cancelled">ملغاة</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(invoice.id)}
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

          {/* View Invoice Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>تفاصيل الفاتورة</span>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 ml-2" />
                    طباعة
                  </Button>
                </DialogTitle>
              </DialogHeader>
              {selectedInvoice && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">رقم الفاتورة</Label>
                      <p className="font-medium">{selectedInvoice.invoice_number}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">العميل</Label>
                      <p>{selectedInvoice.customer?.name || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">تاريخ الفاتورة</Label>
                      <p>
                        {format(new Date(selectedInvoice.invoice_date), "dd/MM/yyyy", {
                          locale: ar,
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">تاريخ الاستحقاق</Label>
                      <p>
                        {selectedInvoice.due_date
                          ? format(new Date(selectedInvoice.due_date), "dd/MM/yyyy", { locale: ar })
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">الحالة</Label>
                      <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>سعر الوحدة</TableHead>
                          <TableHead>الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name || item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit_price} جنيه</TableCell>
                            <TableCell>{item.total} جنيه</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{selectedInvoice.subtotal?.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الخصم ({selectedInvoice.discount_rate}%):</span>
                      <span>-{selectedInvoice.discount_amount?.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة ({selectedInvoice.tax_rate}%):</span>
                      <span>{selectedInvoice.tax_amount?.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>الإجمالي:</span>
                      <span>{selectedInvoice.total?.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>المدفوع:</span>
                      <span>{selectedInvoice.paid_amount?.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between text-destructive font-medium">
                      <span>المتبقي:</span>
                      <span>
                        {(selectedInvoice.total - selectedInvoice.paid_amount)?.toFixed(2)} جنيه
                      </span>
                    </div>
                  </div>

                  {selectedInvoice.notes && (
                    <div>
                      <Label className="text-muted-foreground">ملاحظات</Label>
                      <p>{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Invoices;
