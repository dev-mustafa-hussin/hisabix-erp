import { useState, useEffect, useRef } from "react";
import { Building2, Save, Loader2, Globe, Phone, MapPin, Calendar, DollarSign, Upload, X, Image } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Company {
  id: string;
  name: string;
  name_ar: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  tax_number: string | null;
  financial_year_start: string | null;
  logo_url: string | null;
}

const CompanySettings = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    country: "مصر",
    currency: "EGP",
    timezone: "Africa/Cairo",
    tax_number: "",
    financial_year_start: "",
    logo_url: "",
  });

  const fetchCompany = async () => {
    if (!user?.id) return;

    setLoading(true);
    
    // Get user's company
    const { data: companyUsers, error: cuError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("is_owner", true)
      .limit(1);

    if (cuError || !companyUsers?.length) {
      setLoading(false);
      return;
    }

    const { data: companyData, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyUsers[0].company_id)
      .single();

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الشركة",
        variant: "destructive",
      });
    } else if (companyData) {
      setCompany(companyData);
      setFormData({
        name: companyData.name || "",
        name_ar: companyData.name_ar || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        website: companyData.website || "",
        address: companyData.address || "",
        city: companyData.city || "",
        country: companyData.country || "مصر",
        currency: companyData.currency || "EGP",
        timezone: companyData.timezone || "Africa/Cairo",
        tax_number: companyData.tax_number || "",
        financial_year_start: companyData.financial_year_start || "",
        logo_url: companyData.logo_url || "",
      });
      setLogoPreview(companyData.logo_url);
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن لا يتجاوز 2 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${company.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;

      // Update company record
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", company.id);

      if (updateError) throw updateError;

      setLogoPreview(logoUrl);
      setFormData({ ...formData, logo_url: logoUrl });

      toast({
        title: "تم الرفع",
        description: "تم رفع شعار الشركة بنجاح",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الشعار",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!company?.id) return;

    setUploadingLogo(true);

    try {
      // Update company record to remove logo
      const { error } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", company.id);

      if (error) throw error;

      setLogoPreview(null);
      setFormData({ ...formData, logo_url: "" });

      toast({
        title: "تم الحذف",
        description: "تم حذف شعار الشركة",
      });
    } catch (error) {
      console.error("Error removing logo:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الشعار",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الشركة",
        variant: "destructive",
      });
      return;
    }

    if (!company?.id) {
      toast({
        title: "خطأ",
        description: "لا توجد شركة لتحديثها",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("companies")
      .update({
        name: formData.name.trim(),
        name_ar: formData.name_ar.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country || "مصر",
        currency: formData.currency || "EGP",
        timezone: formData.timezone || "Africa/Cairo",
        tax_number: formData.tax_number.trim() || null,
        financial_year_start: formData.financial_year_start || null,
      })
      .eq("id", company.id);

    setSaving(false);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات الشركة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الحفظ",
        description: "تم تحديث بيانات الشركة بنجاح",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />

      <main className="mr-64 pt-14 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            إعدادات الشركة
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !company ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد شركة مرتبطة بحسابك</p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <Image className="w-5 h-5 text-primary" />
                  شعار الشركة
                </CardTitle>
                <CardDescription className="text-right">
                  رفع شعار الشركة لعرضه في الفواتير والتقارير
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {/* Logo Preview */}
                  <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="شعار الشركة"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-col gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="gap-2"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      رفع شعار جديد
                    </Button>
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        حذف الشعار
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      الحد الأقصى: 2 ميجابايت - PNG, JPG, WEBP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <Building2 className="w-5 h-5 text-primary" />
                  المعلومات الأساسية
                </CardTitle>
                <CardDescription className="text-right">
                  بيانات الشركة الأساسية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الشركة (عربي)</Label>
                    <Input
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      placeholder="اسم الشركة بالعربي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم الشركة (إنجليزي) *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Company Name"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <div className="relative">
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01xxxxxxxxx"
                        className="pr-10"
                      />
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@company.com"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الرقم الضريبي</Label>
                    <Input
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                      placeholder="الرقم الضريبي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الموقع الإلكتروني</Label>
                    <div className="relative">
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="www.company.com"
                        dir="ltr"
                        className="pr-10"
                      />
                      <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <MapPin className="w-5 h-5 text-primary" />
                  العنوان
                </CardTitle>
                <CardDescription className="text-right">
                  موقع الشركة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label>الدولة</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="الدولة"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>العنوان التفصيلي</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="العنوان بالتفصيل"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <DollarSign className="w-5 h-5 text-primary" />
                  الإعدادات المالية
                </CardTitle>
                <CardDescription className="text-right">
                  إعدادات العملة والسنة المالية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>العملة</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(v) => setFormData({ ...formData, currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                        <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                        <SelectItem value="QAR">ريال قطري (QAR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المنطقة الزمنية</Label>
                    <Select 
                      value={formData.timezone} 
                      onValueChange={(v) => setFormData({ ...formData, timezone: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنطقة الزمنية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Cairo">القاهرة (Africa/Cairo)</SelectItem>
                        <SelectItem value="Asia/Riyadh">الرياض (Asia/Riyadh)</SelectItem>
                        <SelectItem value="Asia/Dubai">دبي (Asia/Dubai)</SelectItem>
                        <SelectItem value="Asia/Kuwait">الكويت (Asia/Kuwait)</SelectItem>
                        <SelectItem value="Asia/Qatar">قطر (Asia/Qatar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>بداية السنة المالية</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.financial_year_start}
                        onChange={(e) => setFormData({ ...formData, financial_year_start: e.target.value })}
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-start">
              <Button type="submit" disabled={saving} className="gap-2 px-8">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ التغييرات
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default CompanySettings;
