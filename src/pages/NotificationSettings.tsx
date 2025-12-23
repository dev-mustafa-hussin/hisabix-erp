import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Bell,
  Clock,
  Mail,
  Package,
  FileText,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface AlertSchedule {
  id: string;
  company_id: string;
  schedule_type: "daily" | "weekly" | "disabled";
  weekly_day: number | null;
  daily_hour: number;
  is_active: boolean;
  last_sent_at: string | null;
}

interface Company {
  id: string;
  name: string;
  email: string | null;
}

const NotificationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  
  // Stock alert settings
  const [stockAlertSchedule, setStockAlertSchedule] = useState<AlertSchedule | null>(null);
  const [stockScheduleForm, setStockScheduleForm] = useState({
    schedule_type: "disabled" as "daily" | "weekly" | "disabled",
    weekly_day: 0,
    daily_hour: 9,
  });

  // Notification preferences
  const [preferences, setPreferences] = useState({
    email_stock_alerts: true,
    email_invoice_reminders: true,
    email_low_stock_warning: true,
    email_out_of_stock_alert: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);

      // Get company
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (companyUser) {
        setCompanyId(companyUser.company_id);

        // Fetch company details
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, email")
          .eq("id", companyUser.company_id)
          .maybeSingle();

        if (companyData) {
          setCompany(companyData);
        }

        // Fetch stock alert schedule
        const { data: schedule } = await supabase
          .from("stock_alert_schedules")
          .select("*")
          .eq("company_id", companyUser.company_id)
          .maybeSingle();

        if (schedule) {
          setStockAlertSchedule(schedule as AlertSchedule);
          setStockScheduleForm({
            schedule_type: schedule.schedule_type as "daily" | "weekly" | "disabled",
            weekly_day: schedule.weekly_day || 0,
            daily_hour: schedule.daily_hour,
          });
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const handleSaveStockSchedule = async () => {
    if (!companyId) return;

    setSaving(true);

    try {
      if (stockAlertSchedule) {
        const { error } = await supabase
          .from("stock_alert_schedules")
          .update({
            schedule_type: stockScheduleForm.schedule_type,
            weekly_day: stockScheduleForm.schedule_type === "weekly" ? stockScheduleForm.weekly_day : null,
            daily_hour: stockScheduleForm.daily_hour,
            is_active: stockScheduleForm.schedule_type !== "disabled",
          })
          .eq("id", stockAlertSchedule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("stock_alert_schedules")
          .insert({
            company_id: companyId,
            schedule_type: stockScheduleForm.schedule_type,
            weekly_day: stockScheduleForm.schedule_type === "weekly" ? stockScheduleForm.weekly_day : null,
            daily_hour: stockScheduleForm.daily_hour,
            is_active: stockScheduleForm.schedule_type !== "disabled",
          });

        if (error) throw error;
      }

      toast.success("تم حفظ إعدادات التنبيهات بنجاح");
      
      // Refresh schedule
      const { data: schedule } = await supabase
        .from("stock_alert_schedules")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (schedule) {
        setStockAlertSchedule(schedule as AlertSchedule);
      }
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const weekDays = [
    { value: 0, label: "الأحد" },
    { value: 1, label: "الإثنين" },
    { value: 2, label: "الثلاثاء" },
    { value: 3, label: "الأربعاء" },
    { value: 4, label: "الخميس" },
    { value: 5, label: "الجمعة" },
    { value: 6, label: "السبت" },
  ];

  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, "0")}:00`,
  }));

  const getScheduleStatusBadge = () => {
    if (!stockAlertSchedule || stockScheduleForm.schedule_type === "disabled") {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          معطل
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-emerald-500/20 text-emerald-600 border-0">
        <CheckCircle className="w-3 h-3" />
        مفعل - {stockScheduleForm.schedule_type === "daily" ? "يومي" : "أسبوعي"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Sidebar />
        <Header />
        <main className="mr-64 pt-14 p-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />

      <main className="mr-64 pt-14 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            إعدادات الإشعارات
          </h1>
        </div>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              إعدادات البريد الإلكتروني
            </CardTitle>
            <CardDescription className="text-right">
              تكوين البريد الإلكتروني لاستقبال الإشعارات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="text-right">
                  <p className="font-medium">البريد الإلكتروني للشركة</p>
                  <p className="text-sm text-muted-foreground">
                    سيتم إرسال جميع الإشعارات إلى هذا البريد
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {company?.email ? (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {company.email}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      غير محدد
                    </Badge>
                  )}
                </div>
              </div>
              {!company?.email && (
                <p className="text-sm text-amber-600 text-right">
                  يرجى إضافة البريد الإلكتروني للشركة في{" "}
                  <a href="/company-settings" className="underline">
                    إعدادات الشركة
                  </a>{" "}
                  لتفعيل الإشعارات
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              {getScheduleStatusBadge()}
              <CardTitle className="text-right flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                تنبيهات المخزون
              </CardTitle>
            </div>
            <CardDescription className="text-right">
              جدولة تنبيهات المخزون المنخفض والنافذ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Schedule Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block">نوع الجدولة</Label>
                <Select
                  value={stockScheduleForm.schedule_type}
                  onValueChange={(value: "daily" | "weekly" | "disabled") =>
                    setStockScheduleForm({ ...stockScheduleForm, schedule_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الجدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">معطل</SelectItem>
                    <SelectItem value="daily">يومياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {stockScheduleForm.schedule_type !== "disabled" && (
                <div className="space-y-2">
                  <Label className="text-right block">وقت الإرسال (UTC)</Label>
                  <Select
                    value={stockScheduleForm.daily_hour.toString()}
                    onValueChange={(value) =>
                      setStockScheduleForm({ ...stockScheduleForm, daily_hour: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوقت" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value.toString()}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {stockScheduleForm.schedule_type === "weekly" && (
              <div className="space-y-2">
                <Label className="text-right block">يوم الإرسال</Label>
                <Select
                  value={stockScheduleForm.weekly_day.toString()}
                  onValueChange={(value) =>
                    setStockScheduleForm({ ...stockScheduleForm, weekly_day: parseInt(value) })
                  }
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="اختر اليوم" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notification Types */}
            <div className="space-y-4">
              <Label className="text-right block font-medium">أنواع التنبيهات</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Switch
                    checked={preferences.email_low_stock_warning}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, email_low_stock_warning: checked })
                    }
                  />
                  <div className="text-right">
                    <p className="font-medium">تنبيه المخزون المنخفض</p>
                    <p className="text-sm text-muted-foreground">
                      إشعار عند وصول المخزون للحد الأدنى
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Switch
                    checked={preferences.email_out_of_stock_alert}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, email_out_of_stock_alert: checked })
                    }
                  />
                  <div className="text-right">
                    <p className="font-medium">تنبيه نفاذ المخزون</p>
                    <p className="text-sm text-muted-foreground">
                      إشعار عند نفاذ أي منتج من المخزون
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Sent Info */}
            {stockAlertSchedule?.last_sent_at && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(stockAlertSchedule.last_sent_at), "dd/MM/yyyy HH:mm", {
                      locale: ar,
                    })}
                  </Badge>
                  <p className="text-sm text-muted-foreground">آخر إرسال</p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-start">
              <Button onClick={handleSaveStockSchedule} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ الإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              تذكيرات الفواتير
            </CardTitle>
            <CardDescription className="text-right">
              إعدادات التذكير بالفواتير المتأخرة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Switch
                checked={preferences.email_invoice_reminders}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email_invoice_reminders: checked })
                }
              />
              <div className="text-right">
                <p className="font-medium">تذكير الفواتير المتأخرة</p>
                <p className="text-sm text-muted-foreground">
                  إرسال تذكير للعملاء بالفواتير المستحقة
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground text-right">
                💡 يمكنك إرسال تذكيرات الفواتير يدوياً من صفحة الفواتير لكل فاتورة على حدة
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationSettings;
