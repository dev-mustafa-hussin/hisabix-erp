import { useState, useEffect, useRef } from "react";
import { Store, Save, Loader2, Palette, Globe, MessageSquare, Facebook, Instagram, Video, Upload, X, Image as ImageIcon } from "lucide-react";
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

interface StoreSettings {
  id?: string;
  company_id: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  theme_mode: "light" | "dark";
  whatsapp_number: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
}

const OnlineStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    slug: "",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    theme_mode: "light" as "light" | "dark",
    whatsapp_number: "",
    facebook_url: "",
    instagram_url: "",
    tiktok_url: "",
  });

  const fetchSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    
    try {
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

      const companyId = companyUsers[0].company_id;

      // Try to fetch existing settings
      const { data: settingsData, error } = await supabase
        .from("online_store_settings")
        .select("*")
        .eq("company_id", companyId)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 is "No rows found"
        throw error;
      }

      if (settingsData) {
        setSettings(settingsData);
        setFormData({
          slug: settingsData.slug || "",
          primary_color: settingsData.primary_color || "#000000",
          secondary_color: settingsData.secondary_color || "#ffffff",
          theme_mode: (settingsData.theme_mode as "light" | "dark") || "light",
          whatsapp_number: settingsData.whatsapp_number || "",
          facebook_url: settingsData.facebook_url || "",
          instagram_url: settingsData.instagram_url || "",
          tiktok_url: settingsData.tiktok_url || "",
        });
        setLogoPreview(settingsData.logo_url);
      } else {
        // Provide the company_id for a new entry
        setSettings({ company_id: companyId } as StoreSettings);
      }
    } catch (error) {
      console.error("Error fetching store settings:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إعدادات المتجر",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings?.company_id) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف صورة", variant: "destructive" });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `store-logo-${settings.company_id}-${Date.now()}.${fileExt}`;
      const filePath = `store-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
      const logoUrl = urlData.publicUrl;

      // Update locally, will be saved on form submit or we can update now
      setLogoPreview(logoUrl);
      
      toast({ title: "تم الرفع", description: "تم رفع شعار المتجر بنجاح" });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({ title: "خطأ", description: "فشل في رفع الشعار", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.slug.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال رابط المتجر", variant: "destructive" });
      return;
    }

    if (!settings?.company_id) return;

    setSaving(true);
    try {
      const payload = {
        company_id: settings.company_id,
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        theme_mode: formData.theme_mode,
        whatsapp_number: formData.whatsapp_number.trim() || null,
        facebook_url: formData.facebook_url.trim() || null,
        instagram_url: formData.instagram_url.trim() || null,
        tiktok_url: formData.tiktok_url.trim() || null,
        logo_url: logoPreview,
      };

      let error;
      if (settings.id) {
        const { error: updateError } = await supabase
          .from("online_store_settings")
          .update(payload)
          .eq("id", settings.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("online_store_settings")
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: "تم الحفظ", description: "تم تحديث إعدادات المتجر بنجاح" });
      fetchSettings();
    } catch (error: any) {
      console.error("Error saving store settings:", error);
      toast({
        title: "خطأ",
        description: error.code === "23505" ? "رابط المتجر هذا مستخدم بالفعل" : "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />

      <main className="mr-64 pt-14 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            إعدادات المتجر الإلكتروني
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  رابط المتجر
                </CardTitle>
                <CardDescription className="text-right">
                  حدد الرابط الفريد لمتجرك على الإنترنت
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-row-reverse text-left">
                  <span className="text-muted-foreground font-mono">hisabix.com/store/</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="my-cool-store"
                    className="max-w-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  هوية المتجر البصرية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 justify-start">
                  <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Store className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      رفع شعار للمتجر
                    </Button>
                    {logoPreview && (
                      <Button type="button" variant="ghost" className="text-destructive" onClick={() => setLogoPreview(null)}>
                        حذف
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" /> اللون الأساسي
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" /> اللون الثانوي
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>نمط العرض</Label>
                    <Select
                      value={formData.theme_mode}
                      onValueChange={(v: "light" | "dark") => setFormData({ ...formData, theme_mode: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">وضع فاتح (Light)</SelectItem>
                        <SelectItem value="dark">وضع مظلم (Dark)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  روابط التواصل الاجتماعي
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الواتساب</Label>
                  <div className="relative">
                    <Input
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      placeholder="+201xxxxxxxxx"
                      dir="ltr"
                      className="pl-10"
                    />
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#25D366]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رابط فيسبوك</Label>
                  <div className="relative">
                    <Input
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      dir="ltr"
                      className="pl-10"
                    />
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1877F2]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رابط انستجرام</Label>
                  <div className="relative">
                    <Input
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      dir="ltr"
                      className="pl-10"
                    />
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E4405F]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رابط تيك توك</Label>
                  <div className="relative">
                    <Input
                      value={formData.tiktok_url}
                      onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                      dir="ltr"
                      className="pl-10"
                    />
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-start">
              <Button type="submit" disabled={saving} className="gap-2 px-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ إعدادات المتجر
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default OnlineStoreSettings;
