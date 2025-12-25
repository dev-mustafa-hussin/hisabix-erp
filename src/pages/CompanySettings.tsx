import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Save,
  Loader2,
  Upload,
  Calendar as CalendarIcon,
  Info,
  PlusCircle,
  Edit,
  Globe,
  Phone,
  MapPin,
  DollarSign,
  X,
  Image as ImageIcon,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Types matching the extended schema
interface CompanySettingsData {
  id?: string;
  name: string;
  start_date: Date | undefined;
  default_profit_percent: number;
  currency: string;
  currency_symbol_placement: string;
  timezone: string;
  logo_url: string | null;
  financial_year_start: string;
  stock_accounting_method: string;
  transaction_edit_days: number;
  date_format: string;
  time_format: string;
  currency_precision: number;
  quantity_precision: number;
  // Extra fields that might be used later or were in old schema
  name_ar?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_number?: string;
}

const TABS = [
  { id: "business", label: "النشاط", icon: Building2 },
  { id: "tax", label: "الضريبة", icon: DollarSign },
  { id: "product", label: "المنتج", icon: Loader2 },
  { id: "contact", label: "جهة اتصال", icon: Phone },
  { id: "sale", label: "البيع", icon: DollarSign },
  { id: "pos", label: "نقطة بيع", icon: Loader2 },
  { id: "display", label: "Display Screen", icon: Globe },
  { id: "purchases", label: "المشتريات", icon: Loader2 },
  { id: "payment", label: "دفع", icon: DollarSign },
  { id: "dashboard", label: "الرئيسية", icon: Building2 },
  { id: "system", label: "النظام", icon: Loader2 },
  { id: "prefixes", label: "الاختصارات", icon: Edit },
  { id: "email", label: "إعدادات البريد الإلكتروني", icon: Loader2 },
  { id: "sms", label: "إعدادات الرسائل القصيرة", icon: Loader2 },
  { id: "rewards", label: " اعدادات نقاط المكافآت", icon: PlusCircle },
  { id: "modules", label: "وحدات", icon: Loader2 },
  { id: "labels", label: "التسميات المخصصة", icon: Edit },
];

const CompanySettings = () => {
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<CompanySettingsData>({
    name: "",
    start_date: new Date(),
    default_profit_percent: 25.0,
    currency: "EGP",
    currency_symbol_placement: "before",
    timezone: "Africa/Cairo",
    logo_url: null,
    financial_year_start: "January",
    stock_accounting_method: "FIFO",
    transaction_edit_days: 30,
    date_format: "mm/dd/yyyy",
    time_format: "24h",
    currency_precision: 2,
    quantity_precision: 2,
  });

  useEffect(() => {
    fetchCompany();
  }, [user?.id]);

  const fetchCompany = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. Try to find the company linked to the user
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyUser) {
        const { data: company } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyUser.company_id)
          .single();

        if (company) {
          setFormData({
            id: company.id,
            name: company.name || "",
            start_date: company.start_date
              ? new Date(company.start_date)
              : new Date(),
            default_profit_percent: company.default_profit_percent || 25.0,
            currency: company.currency || "EGP",
            currency_symbol_placement:
              company.currency_symbol_placement || "before",
            timezone: company.timezone || "Africa/Cairo",
            logo_url: company.logo_url,
            financial_year_start: company.financial_year_start || "January",
            stock_accounting_method: company.stock_accounting_method || "FIFO",
            transaction_edit_days: company.transaction_edit_days || 30,
            date_format: company.date_format || "mm/dd/yyyy",
            time_format: company.time_format || "24h",
            currency_precision: company.currency_precision || 2,
            quantity_precision: company.quantity_precision || 2,
            // Keep other fields if they exist in DB but not in form view yet
            name_ar: company.name_ar,
            email: company.email,
            phone: company.phone,
            website: company.website,
            address: company.address,
            city: company.city,
            country: company.country,
            tax_number: company.tax_number,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الشركة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "الحجم الأقصى 2 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      toast({ title: "تم الرفع", description: "تم رفع الشعار بنجاح" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "خطأ",
        description: "فشل رفع الشعار",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "اسم النشاط مطلوب",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        start_date: formData.start_date?.toISOString(),
        default_profit_percent: formData.default_profit_percent,
        currency: formData.currency,
        currency_symbol_placement: formData.currency_symbol_placement,
        timezone: formData.timezone,
        logo_url: formData.logo_url,
        financial_year_start: formData.financial_year_start,
        stock_accounting_method: formData.stock_accounting_method,
        transaction_edit_days: formData.transaction_edit_days,
        date_format: formData.date_format,
        time_format: formData.time_format,
        currency_precision: formData.currency_precision,
        quantity_precision: formData.quantity_precision,
        // Preserve existing if not in form
        name_ar: formData.name_ar,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        tax_number: formData.tax_number,
      };

      if (formData.id) {
        // Update existing
        const { error } = await supabase
          .from("companies")
          .update(payload)
          .eq("id", formData.id);

        if (error) throw error;
        toast({ title: "تم الحفظ", description: "تم تحديث الإعدادات بنجاح" });
      } else {
        // Create New & Link
        const { data: newCompany, error: createError } = await supabase
          .from("companies")
          .insert(payload)
          .select()
          .single();

        if (createError) throw createError;

        if (user?.id && newCompany) {
          const { error: linkError } = await supabase
            .from("company_users")
            .insert({
              company_id: newCompany.id,
              user_id: user.id,
              role: "admin",
              is_owner: true,
            });

          if (linkError) throw linkError;

          // Ensure profile exists
          await supabase.from("profiles").upsert({
            user_id: user.id,
            full_name: user.email?.split("@")[0] || "Admin",
            username: user.email?.split("@")[0] || "admin",
          });

          setFormData((prev) => ({ ...prev, id: newCompany.id }));
          toast({
            title: "تم الإنشاء",
            description: "تم إنشاء الشركة وربط الحساب بنجاح",
          });
        }
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const LabelWithIcon = ({
    label,
    required = false,
  }: {
    label: string;
    required?: boolean;
  }) => (
    <div className="flex items-center gap-1 mb-2">
      <Label className="text-base font-normal">{label}</Label>
      {required && <span className="text-red-500">*</span>}
      <Info className="w-4 h-4 text-primary/60 cursor-help" />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">إعدادات الشركة</h1>
          {loading && <Loader2 className="animate-spin" />}
        </div>

        <div className="flex gap-6 h-full">
          {/* Content Area (Left Side in LTR, Right in RTL - standard layout) */}
          <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar pr-2">
            <form onSubmit={handleSubmit}>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-6">
                  {/* Row 1 */}
                  <div>
                    <LabelWithIcon label="اسم النشاط" required />
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((getHeader) => ({
                          ...getHeader,
                          name: e.target.value,
                        }))
                      }
                      placeholder="اسم النشاط"
                      className="font-bold"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <LabelWithIcon label="تاريخ البدء" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-muted/20",
                              !formData.start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.start_date ? (
                              format(formData.start_date, "MM/dd/yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.start_date}
                            onSelect={(date) =>
                              setFormData((prev) => ({
                                ...prev,
                                start_date: date,
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="relative">
                      <LabelWithIcon label="نسبة الربح الافتراضي" />
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.default_profit_percent}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              default_profit_percent: parseFloat(
                                e.target.value
                              ),
                            }))
                          }
                          className="pl-10"
                        />
                        <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <LabelWithIcon label="العملة" />
                      <Select
                        value={formData.currency}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, currency: v }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EGP">
                            Egypt - Pounds(EGP)
                          </SelectItem>
                          <SelectItem value="USD">
                            USA - Dollars(USD)
                          </SelectItem>
                          <SelectItem value="SAR">
                            Saudi Arabia - Riyal(SAR)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <LabelWithIcon label="تحديد مكان رمز العملة" />
                      <Select
                        value={formData.currency_symbol_placement}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            currency_symbol_placement: v,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">قبل السعر</SelectItem>
                          <SelectItem value="after">بعد السعر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 3.5: Timezone (Full Width in screenshot row 3, assuming) */}
                  <div>
                    <LabelWithIcon label="المنطقة الزمنية" />
                    <Select
                      value={formData.timezone}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, timezone: v }))
                      }
                    >
                      <SelectTrigger className="bg-muted/20">
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Cairo">
                          Africa/Cairo
                        </SelectItem>
                        <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 4: Logo */}
                  <div>
                    <LabelWithIcon label="تحميل الشعار" />
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        placeholder={
                          formData.logo_url
                            ? "تم اختيار ملف"
                            : "لم يتم اختيار ملف"
                        }
                        className="bg-muted/20"
                      />
                      <div className="relative">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Button
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
                        >
                          تصفح...
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      سيتم استبدال الشعار السابق (إن وجد)
                    </p>
                    {formData.logo_url && (
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="h-16 mt-2 object-contain"
                      />
                    )}
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <LabelWithIcon label="تاريخ بداية السنة المالية" />
                      <Select
                        value={formData.financial_year_start}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            financial_year_start: v,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="الشهر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="January">يناير</SelectItem>
                          <SelectItem value="February">فبراير</SelectItem>
                          {/* Add others as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <LabelWithIcon label="طريقة المحاسبة" />
                      <Select
                        value={formData.stock_accounting_method}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            stock_accounting_method: v,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="الطريقة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIFO">
                            (أول دخول أول خروج) FIFO
                          </SelectItem>
                          <SelectItem value="LIFO">
                            (آخر دخول أول خروج) LIFO
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 6 */}
                  <div>
                    <LabelWithIcon label="تغيير أيام المعاملة" />
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.transaction_edit_days}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            transaction_edit_days: parseInt(e.target.value),
                          }))
                        }
                        className="bg-muted/20 pr-10"
                        dir="ltr"
                      />
                      <Edit className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Row 7 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <LabelWithIcon label="صيغة التاريخ" />
                      <Select
                        value={formData.date_format}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, date_format: v }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="الصيغة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm/dd/yyyy">mm/dd/yyyy</SelectItem>
                          <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <LabelWithIcon label="تنسيق الوقت" />
                      <Select
                        value={formData.time_format}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, time_format: v }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="التنسيق" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24 ساعة</SelectItem>
                          <SelectItem value="12h">12 ساعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 8 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <LabelWithIcon label=":Currency Precision" />
                      <Select
                        value={formData.currency_precision.toString()}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            currency_precision: parseInt(v),
                          }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="Precision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <LabelWithIcon label=":Quantity Precision" />
                      <Select
                        value={formData.quantity_precision.toString()}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            quantity_precision: parseInt(v),
                          }))
                        }
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="Precision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t mt-4 flex justify-center z-10">
                <Button
                  type="submit"
                  className="bg-[#ff4d4f] hover:bg-[#ff7875] text-white px-12 py-6 text-lg"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                  تحديث الإعدادات
                </Button>
              </div>
            </form>
          </div>

          {/* Vertical Tabs (Sidebar) - Right Side */}
          <div className="w-[280px] bg-card rounded-lg border h-fit sticky top-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b last:border-0 hover:bg-muted/50",
                    isActive
                      ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                      : "text-foreground bg-white"
                  )}
                >
                  {/* Icon logic: show specific icons if needed, simplify for now */}
                  <span className="flex-1 text-right">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanySettings;
