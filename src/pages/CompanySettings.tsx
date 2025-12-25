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
        // Create New & Link via RPC (Safe)
        const { data: newCompanyId, error: createError } = await supabase.rpc(
          "create_company_setting",
          {
            _name: formData.name,
            _start_date: formData.start_date?.toISOString(),
            _currency: formData.currency,
            _default_profit_percent: formData.default_profit_percent,
            _currency_symbol_placement: formData.currency_symbol_placement,
            _timezone: formData.timezone,
            _financial_year_start: formData.financial_year_start,
            _stock_accounting_method: formData.stock_accounting_method,
            _transaction_edit_days: formData.transaction_edit_days,
            _date_format: formData.date_format,
            _time_format: formData.time_format,
            _currency_precision: formData.currency_precision,
            _quantity_precision: formData.quantity_precision,
            _logo_url: formData.logo_url,
          }
        );

        if (createError) throw createError;

        if (newCompanyId) {
          setFormData((prev) => ({ ...prev, id: newCompanyId }));
          toast({
            title: "تم بنجاح",
            description: "تم إنشاء ملف الشركة وربط حسابك بنجاح!",
            variant: "default", // Green-ish usually default or specific success
            className: "bg-green-600 text-white border-none",
          });

          // Force reload after 1.5s to refresh context
          setTimeout(() => {
            window.location.reload();
          }, 1500);
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
      <div className="p-4 md:p-8 min-h-[calc(100vh-80px)] flex flex-col items-start gap-6">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[#3b82f6] bg-clip-text text-transparent">
              إعدادات الشركة
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة ملف الشركة، السياسات المالية، والإعدادات العامة
            </p>
          </div>
          {loading && <Loader2 className="animate-spin text-primary w-6 h-6" />}
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar (Vertical Tabs) - First Child = Right in RTL */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-2 sticky top-6">
            <Card className="border-0 shadow-lg bg-card overflow-hidden">
              <div className="flex flex-col">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "group relative w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all duration-300 border-b border-border/50 last:border-0",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l-full" />
                      )}
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="flex-1 text-right">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content Form - Second Child = Left in RTL */}
          <div className="flex-1 w-full min-w-0">
            <form onSubmit={handleSubmit}>
              <Card className="border-0 shadow-lg bg-card overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  {/* Section Title */}
                  <div className="pb-4 border-b border-border/50">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      بيانات النشاط الأساسية
                    </h2>
                  </div>

                  {/* Row 1: Name */}
                  <div className="grid gap-2">
                    <LabelWithIcon label="اسم النشاط" required />
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((getHeader) => ({
                          ...getHeader,
                          name: e.target.value,
                        }))
                      }
                      placeholder="أدخل اسم الشركة الرسمي"
                      className="h-12 text-lg font-medium bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Row 2: Date & Profit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-2">
                      <LabelWithIcon label="تاريخ البدء" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-12 justify-start text-left font-normal bg-background hover:bg-muted/50 border-input",
                              !formData.start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                            {formData.start_date ? (
                              format(formData.start_date, "MM/dd/yyyy")
                            ) : (
                              <span>اختر تاريخ</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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
                    <div className="grid gap-2">
                      <LabelWithIcon label="نسبة الربح الافتراضي (%)" />
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
                          className="pl-12 h-12 bg-background text-lg"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold">
                          %
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-2">
                      <LabelWithIcon label="العملة الأساسية" />
                      <Select
                        value={formData.currency}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, currency: v }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EGP">
                            الجنيه المصري (EGP)
                          </SelectItem>
                          <SelectItem value="USD">
                            الدولار الأمريكي (USD)
                          </SelectItem>
                          <SelectItem value="SAR">
                            الريال السعودي (SAR)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <LabelWithIcon label="موضع العملة" />
                      <Select
                        value={formData.currency_symbol_placement}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            currency_symbol_placement: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">
                            يمين السعر (100 $)
                          </SelectItem>
                          <SelectItem value="after">
                            يسار السعر ($ 100)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 3.5: Timezone */}
                  <div className="grid gap-2">
                    <LabelWithIcon label="المنطقة الزمنية" />
                    <Select
                      value={formData.timezone}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, timezone: v }))
                      }
                    >
                      <SelectTrigger className="h-12 bg-background">
                        <Globe className="w-4 h-4 path-primary ml-2 text-muted-foreground" />
                        <SelectValue placeholder="اختر المنطقة الزمنية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Cairo">
                          القاهرة - مصر (Africa/Cairo)
                        </SelectItem>
                        <SelectItem value="Asia/Riyadh">
                          الرياض - السعودية (Asia/Riyadh)
                        </SelectItem>
                        <SelectItem value="Asia/Dubai">
                          دبي - الإمارات (Asia/Dubai)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-border/50 my-6" />

                  {/* Row 4: Logo Upload - Enhanced UI */}
                  <div className="bg-muted/30 border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative group">
                    <div className="absolute inset-0 z-10 cursor-pointer">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>

                    {formData.logo_url ? (
                      <div className="relative w-32 h-32 mb-4 bg-background rounded-lg shadow-sm border p-2">
                        <img
                          src={formData.logo_url}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}

                    <h3 className="text-lg font-medium text-foreground mb-1">
                      {formData.logo_url
                        ? "تغيير شعار الشركة"
                        : "رفع شعار الشركة"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      اضغط للرفع أو اسحب الصورة هنا. (PNG, JPG, الحد الأقصى 2MB)
                    </p>
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-border/50 my-6" />

                  {/* Advanced Settings Title */}
                  <div className="pb-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground/80">
                      إعدادات متقدمة
                    </h2>
                  </div>

                  {/* Financial Year & Accounting */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-2">
                      <LabelWithIcon label="بداية السنة المالية" />
                      <Select
                        value={formData.financial_year_start}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            financial_year_start: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="الشهر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="January">
                            يناير (January)
                          </SelectItem>
                          <SelectItem value="July">يوليو (July)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <LabelWithIcon label="طريقة احتساب المخزون" />
                      <Select
                        value={formData.stock_accounting_method}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            stock_accounting_method: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="الطريقة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIFO">
                            الوارد أولاً يصرف أولاً (FIFO)
                          </SelectItem>
                          <SelectItem value="LIFO">
                            الوارد أخيراً يصرف أولاً (LIFO)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Transaction Edit Days */}
                  <div className="grid gap-2">
                    <LabelWithIcon label="فترة السماح بتعديل المعاملات (أيام)" />
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
                        className="h-12 bg-background"
                        dir="ltr"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        يوم
                      </div>
                    </div>
                  </div>

                  {/* Date Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-2">
                      <LabelWithIcon label="صيغة التاريخ" />
                      <Select
                        value={formData.date_format}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, date_format: v }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="الصيغة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm/dd/yyyy">
                            الشهر/اليوم/السنة (MM/DD/YYYY)
                          </SelectItem>
                          <SelectItem value="dd/mm/yyyy">
                            اليوم/الشهر/السنة (DD/MM/YYYY)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <LabelWithIcon label="تنسيق الوقت" />
                      <Select
                        value={formData.time_format}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, time_format: v }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="التنسيق" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">نظام 24 ساعة</SelectItem>
                          <SelectItem value="12h">
                            نظام 12 ساعة (م/ص)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Precisions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-2">
                      <LabelWithIcon label="الكسور العشرية للعملة" />
                      <Select
                        value={formData.currency_precision.toString()}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            currency_precision: parseInt(v),
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="عدد الخانات" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">بدون كسور (0)</SelectItem>
                          <SelectItem value="2">خانتين (0.00)</SelectItem>
                          <SelectItem value="3">3 خانات (0.000)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <LabelWithIcon label="الكسور العشرية للكميات" />
                      <Select
                        value={formData.quantity_precision.toString()}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            quantity_precision: parseInt(v),
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background">
                          <SelectValue placeholder="عدد الخانات" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">أعداد صحيحة فقط (0)</SelectItem>
                          <SelectItem value="2">خانتين (0.00)</SelectItem>
                          <SelectItem value="3">3 خانات (0.000)</SelectItem>
                          <SelectItem value="4">دقة عالية (0.0000)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="p-6 bg-muted/20 border-t flex justify-center sticky bottom-0 z-10 backdrop-blur-sm">
                  <Button
                    type="submit"
                    className="bg-[#ff4d4f] hover:bg-[#ff7875] text-white px-12 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <Save className="mr-2 w-5 h-5" />
                    )}
                    حفظ التغييرات
                  </Button>
                </div>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanySettings;
