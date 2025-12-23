import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Users, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
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

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  balance: number;
  credit_limit: number;
  notes: string | null;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    credit_limit: "0",
    notes: "",
  });

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل العملاء",
        variant: "destructive",
      });
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      credit_limit: "0",
      notes: "",
    });
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        credit_limit: String(customer.credit_limit || 0),
        notes: customer.notes || "",
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
        description: "يرجى إدخال اسم العميل",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    // Get the user's company (for now, we'll need to handle this properly)
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

    const customerData = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      credit_limit: parseFloat(formData.credit_limit) || 0,
      notes: formData.notes.trim() || null,
      company_id: companyId,
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", editingCustomer.id);

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل في تحديث العميل",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات العميل بنجاح",
        });
        fetchCustomers();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("customers").insert(customerData);

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل في إضافة العميل",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تمت الإضافة",
          description: "تم إضافة العميل بنجاح",
        });
        fetchCustomers();
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", deleteCustomer.id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف العميل",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الحذف",
        description: "تم حذف العميل بنجاح",
      });
      fetchCustomers();
    }
    setDeleteCustomer(null);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />

      <main className="mr-64 pt-14 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة عميل
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "تعديل العميل" : "إضافة عميل جديد"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم العميل *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="اسم العميل"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المدينة</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="المدينة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>حد الائتمان</Label>
                    <Input
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="العنوان التفصيلي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingCustomer ? (
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

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن عميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 w-64"
              />
            </div>
            <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              إدارة العملاء
            </h1>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mb-4" />
              <p>لا يوجد عملاء</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الإجراءات</TableHead>
                  <TableHead className="text-right">الرصيد</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">اسم العميل</TableHead>
                  <TableHead className="text-right w-12">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(customer)}
                        >
                          <Pencil className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteCustomer(customer)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{customer.balance} ج.م</TableCell>
                    <TableCell>{customer.city || "-"}</TableCell>
                    <TableCell dir="ltr" className="text-right">{customer.phone || "-"}</TableCell>
                    <TableCell dir="ltr" className="text-right">{customer.email || "-"}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{index + 1}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف العميل "{deleteCustomer?.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
