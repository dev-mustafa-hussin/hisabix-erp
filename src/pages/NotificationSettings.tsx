import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Palette,
  Eye,
  RotateCcw,
  TrendingUp,
  Send,
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

interface EmailTemplate {
  id: string;
  company_id: string;
  template_type: string;
  subject: string;
  body_html: string;
  is_active: boolean;
}

interface MovementChangeAlert {
  id: string;
  company_id: string;
  is_active: boolean;
  threshold_percent: number;
  comparison_days: number;
  recipient_email: string | null;
  last_checked_at: string | null;
}

const defaultTemplates: Record<string, { subject: string; body_html: string }> = {
  stock_alert: {
    subject: "⚠️ تنبيه المخزون - {{company_name}} ({{total_products}} منتج)",
    body_html: `<h1 style="color: #1f2937; text-align: center;">🏪 {{company_name}}</h1>
<h2 style="color: #374151; text-align: center;">تنبيه المخزون</h2>
<p style="color: #6b7280; text-align: center;">هناك {{total_products}} منتج يحتاج إلى اهتمامك</p>
{{out_of_stock_table}}
{{low_stock_table}}
<div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
  <p style="margin: 0; color: #0369a1;">يرجى مراجعة المخزون وإعادة تعبئة المنتجات المنخفضة</p>
</div>`,
  },
  invoice_reminder: {
    subject: "تذكير: فاتورة متأخرة رقم {{invoice_number}}",
    body_html: `<h1 style="color: #dc2626; text-align: center;">⚠️ تذكير بفاتورة متأخرة</h1>
<p>عزيزي {{customer_name}}،</p>
<p>نود تذكيرك بأن لديك فاتورة متأخرة عن موعد السداد. نرجو منك سداد المبلغ المستحق في أقرب وقت ممكن.</p>
<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
  <p><strong>رقم الفاتورة:</strong> {{invoice_number}}</p>
  <p><strong>تاريخ الاستحقاق:</strong> {{due_date}}</p>
  <p><strong>المبلغ الإجمالي:</strong> {{total}} جنيه</p>
  <p><strong>المبلغ المدفوع:</strong> {{paid_amount}} جنيه</p>
  <p><strong>المبلغ المتبقي:</strong> <span style="font-size: 24px; color: #dc2626; font-weight: bold;">{{remaining}} جنيه</span></p>
</div>
<p>إذا كنت قد قمت بالسداد بالفعل، يرجى تجاهل هذه الرسالة أو التواصل معنا لتحديث السجلات.</p>
<p>شكراً لتعاونكم.</p>
<p>مع أطيب التحيات،<br><strong>{{company_name}}</strong></p>`,
  },
};

const templateTypes = [
  { value: "stock_alert", label: "تنبيه المخزون", icon: Package },
  { value: "invoice_reminder", label: "تذكير الفاتورة", icon: FileText },
];

const templateVariables: Record<string, { name: string; description: string }[]> = {
  stock_alert: [
    { name: "{{company_name}}", description: "اسم الشركة" },
    { name: "{{total_products}}", description: "عدد المنتجات الإجمالي" },
    { name: "{{out_of_stock_count}}", description: "عدد المنتجات النافذة" },
    { name: "{{low_stock_count}}", description: "عدد المنتجات المنخفضة" },
    { name: "{{out_of_stock_table}}", description: "جدول المنتجات النافذة" },
    { name: "{{low_stock_table}}", description: "جدول المنتجات المنخفضة" },
  ],
  invoice_reminder: [
    { name: "{{customer_name}}", description: "اسم العميل" },
    { name: "{{company_name}}", description: "اسم الشركة" },
    { name: "{{invoice_number}}", description: "رقم الفاتورة" },
    { name: "{{due_date}}", description: "تاريخ الاستحقاق" },
    { name: "{{total}}", description: "المبلغ الإجمالي" },
    { name: "{{paid_amount}}", description: "المبلغ المدفوع" },
    { name: "{{remaining}}", description: "المبلغ المتبقي" },
  ],
};

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

  // Email templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState("stock_alert");
  const [templateForm, setTemplateForm] = useState({
    subject: "",
    body_html: "",
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Movement change alerts
  const [movementChangeAlert, setMovementChangeAlert] = useState<MovementChangeAlert | null>(null);
  const [movementAlertForm, setMovementAlertForm] = useState({
    is_active: false,
    threshold_percent: 50,
    comparison_days: 7,
  });
  const [savingMovementAlert, setSavingMovementAlert] = useState(false);
  const [sendingMovementAlert, setSendingMovementAlert] = useState(false);

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

        // Fetch email templates
        const { data: templatesData } = await supabase
          .from("email_templates")
          .select("*")
          .eq("company_id", companyUser.company_id);

        if (templatesData) {
          setTemplates(templatesData as EmailTemplate[]);
        }

        // Fetch movement change alert settings
        const { data: movementAlertData } = await supabase
          .from("movement_change_alerts")
          .select("*")
          .eq("company_id", companyUser.company_id)
          .maybeSingle();

        if (movementAlertData) {
          setMovementChangeAlert(movementAlertData as MovementChangeAlert);
          setMovementAlertForm({
            is_active: movementAlertData.is_active,
            threshold_percent: movementAlertData.threshold_percent,
            comparison_days: movementAlertData.comparison_days,
          });
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  // Update template form when selected type changes
  useEffect(() => {
    const existingTemplate = templates.find(t => t.template_type === selectedTemplateType);
    if (existingTemplate) {
      setTemplateForm({
        subject: existingTemplate.subject,
        body_html: existingTemplate.body_html,
      });
    } else {
      const defaultTemplate = defaultTemplates[selectedTemplateType];
      setTemplateForm({
        subject: defaultTemplate?.subject || "",
        body_html: defaultTemplate?.body_html || "",
      });
    }
  }, [selectedTemplateType, templates]);

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

  const handleSaveTemplate = async () => {
    if (!companyId) return;

    setSavingTemplate(true);

    try {
      const existingTemplate = templates.find(t => t.template_type === selectedTemplateType);

      if (existingTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update({
            subject: templateForm.subject,
            body_html: templateForm.body_html,
          })
          .eq("id", existingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_templates")
          .insert({
            company_id: companyId,
            template_type: selectedTemplateType,
            subject: templateForm.subject,
            body_html: templateForm.body_html,
          });

        if (error) throw error;
      }

      toast.success("تم حفظ القالب بنجاح");

      // Refresh templates
      const { data: templatesData } = await supabase
        .from("email_templates")
        .select("*")
        .eq("company_id", companyId);

      if (templatesData) {
        setTemplates(templatesData as EmailTemplate[]);
      }
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error("فشل في حفظ القالب");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = () => {
    const defaultTemplate = defaultTemplates[selectedTemplateType];
    setTemplateForm({
      subject: defaultTemplate?.subject || "",
      body_html: defaultTemplate?.body_html || "",
    });
    toast.info("تم إعادة تعيين القالب إلى الافتراضي");
  };

  const handleSaveMovementAlert = async () => {
    if (!companyId || !company?.email) {
      toast.error("يجب إضافة البريد الإلكتروني للشركة أولاً");
      return;
    }

    setSavingMovementAlert(true);

    try {
      if (movementChangeAlert) {
        const { error } = await supabase
          .from("movement_change_alerts")
          .update({
            is_active: movementAlertForm.is_active,
            threshold_percent: movementAlertForm.threshold_percent,
            comparison_days: movementAlertForm.comparison_days,
            recipient_email: company.email,
          })
          .eq("id", movementChangeAlert.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("movement_change_alerts")
          .insert({
            company_id: companyId,
            is_active: movementAlertForm.is_active,
            threshold_percent: movementAlertForm.threshold_percent,
            comparison_days: movementAlertForm.comparison_days,
            recipient_email: company.email,
          });

        if (error) throw error;
      }

      toast.success("تم حفظ إعدادات تنبيهات التغييرات بنجاح");

      // Refresh settings
      const { data } = await supabase
        .from("movement_change_alerts")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (data) {
        setMovementChangeAlert(data as MovementChangeAlert);
      }
    } catch (error: any) {
      console.error("Error saving movement alert:", error);
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSavingMovementAlert(false);
    }
  };

  const handleSendMovementAlertNow = async () => {
    if (!companyId || !company?.email) {
      toast.error("يجب إضافة البريد الإلكتروني للشركة أولاً");
      return;
    }

    setSendingMovementAlert(true);

    try {
      const { data, error } = await supabase.functions.invoke("check-movement-changes", {
        body: {
          company_id: companyId,
          recipient_email: company.email,
          company_name: company.name,
          threshold_percent: movementAlertForm.threshold_percent,
          comparison_days: movementAlertForm.comparison_days,
        },
      });

      if (error) throw error;

      if (data?.changes_count === 0) {
        toast.info("لا توجد تغييرات كبيرة في المخزون حالياً");
      } else {
        toast.success(`تم إرسال تنبيه التغييرات (${data?.changes_count} منتج)`);
      }
    } catch (error: any) {
      console.error("Error sending movement alert:", error);
      toast.error("فشل في إرسال التنبيه");
    } finally {
      setSendingMovementAlert(false);
    }
  };

  const getPreviewHtml = () => {
    let html = templateForm.body_html;
    // Replace variables with sample data
    html = html.replace(/\{\{company_name\}\}/g, company?.name || "اسم الشركة");
    html = html.replace(/\{\{total_products\}\}/g, "5");
    html = html.replace(/\{\{out_of_stock_count\}\}/g, "2");
    html = html.replace(/\{\{low_stock_count\}\}/g, "3");
    html = html.replace(/\{\{customer_name\}\}/g, "أحمد محمد");
    html = html.replace(/\{\{invoice_number\}\}/g, "INV-001");
    html = html.replace(/\{\{due_date\}\}/g, "15/01/2024");
    html = html.replace(/\{\{total\}\}/g, "1500.00");
    html = html.replace(/\{\{paid_amount\}\}/g, "500.00");
    html = html.replace(/\{\{remaining\}\}/g, "1000.00");
    html = html.replace(/\{\{out_of_stock_table\}\}/g, `
      <h3 style="color: #dc2626; margin-top: 20px;">⚠️ منتجات نفذت من المخزون (2)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #fef2f2;">
          <th style="padding: 10px; border: 1px solid #fecaca; text-align: right;">المنتج</th>
          <th style="padding: 10px; border: 1px solid #fecaca; text-align: center;">الحد الأدنى</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #fecaca; text-align: right;">منتج تجريبي 1</td>
          <td style="padding: 10px; border: 1px solid #fecaca; text-align: center;">10</td>
        </tr>
      </table>
    `);
    html = html.replace(/\{\{low_stock_table\}\}/g, `
      <h3 style="color: #d97706; margin-top: 20px;">⚡ منتجات بمخزون منخفض (3)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #fffbeb;">
          <th style="padding: 10px; border: 1px solid #fde68a; text-align: right;">المنتج</th>
          <th style="padding: 10px; border: 1px solid #fde68a; text-align: center;">الكمية الحالية</th>
          <th style="padding: 10px; border: 1px solid #fde68a; text-align: center;">الحد الأدنى</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #fde68a; text-align: right;">منتج تجريبي 2</td>
          <td style="padding: 10px; border: 1px solid #fde68a; text-align: center; font-weight: bold; color: #d97706;">3</td>
          <td style="padding: 10px; border: 1px solid #fde68a; text-align: center;">10</td>
        </tr>
      </table>
    `);
    return html;
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

        {/* Movement Change Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              {movementAlertForm.is_active ? (
                <Badge className="gap-1 bg-emerald-500/20 text-emerald-600 border-0">
                  <CheckCircle className="w-3 h-3" />
                  مفعل
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  معطل
                </Badge>
              )}
              <CardTitle className="text-right flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                تنبيهات تغييرات الحركة
              </CardTitle>
            </div>
            <CardDescription className="text-right">
              إرسال تنبيه عند حدوث تغيير كبير في حركة منتج معين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <Switch
                checked={movementAlertForm.is_active}
                onCheckedChange={(checked) =>
                  setMovementAlertForm({ ...movementAlertForm, is_active: checked })
                }
              />
              <div className="text-right">
                <p className="font-medium">تفعيل تنبيهات التغييرات</p>
                <p className="text-sm text-muted-foreground">
                  إرسال تنبيه عند تغيير حركة منتج بنسبة تتجاوز الحد المحدد
                </p>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block">نسبة التغيير (%)</Label>
                <Select
                  value={movementAlertForm.threshold_percent.toString()}
                  onValueChange={(value) =>
                    setMovementAlertForm({ ...movementAlertForm, threshold_percent: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النسبة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25% - حساسية عالية</SelectItem>
                    <SelectItem value="50">50% - حساسية متوسطة</SelectItem>
                    <SelectItem value="75">75% - حساسية منخفضة</SelectItem>
                    <SelectItem value="100">100% - تغييرات كبيرة فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">فترة المقارنة (أيام)</Label>
                <Select
                  value={movementAlertForm.comparison_days.toString()}
                  onValueChange={(value) =>
                    setMovementAlertForm({ ...movementAlertForm, comparison_days: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفترة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 أيام</SelectItem>
                    <SelectItem value="7">أسبوع</SelectItem>
                    <SelectItem value="14">أسبوعين</SelectItem>
                    <SelectItem value="30">شهر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Last Checked Info */}
            {movementChangeAlert?.last_checked_at && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(movementChangeAlert.last_checked_at), "dd/MM/yyyy HH:mm", {
                      locale: ar,
                    })}
                  </Badge>
                  <p className="text-sm text-muted-foreground">آخر فحص</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground text-right">
                💡 سيتم مقارنة حركة المخزون في الفترة المحددة بالفترة السابقة لها مباشرة. سيتم إرسال تنبيه للمنتجات التي تجاوز التغيير في حركتها النسبة المحددة.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-start">
              <Button 
                onClick={handleSendMovementAlertNow} 
                disabled={sendingMovementAlert || !company?.email}
                variant="outline"
                className="gap-2"
              >
                {sendingMovementAlert ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                فحص وإرسال الآن
              </Button>
              <Button 
                onClick={handleSaveMovementAlert} 
                disabled={savingMovementAlert} 
                className="gap-2"
              >
                {savingMovementAlert ? (
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

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              قوالب البريد الإلكتروني
            </CardTitle>
            <CardDescription className="text-right">
              تخصيص محتوى رسائل البريد الإلكتروني للتنبيهات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Type Tabs */}
            <Tabs value={selectedTemplateType} onValueChange={setSelectedTemplateType}>
              <TabsList className="grid w-full grid-cols-2">
                {templateTypes.map((type) => (
                  <TabsTrigger key={type.value} value={type.value} className="gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {templateTypes.map((type) => (
                <TabsContent key={type.value} value={type.value} className="space-y-4 mt-4">
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label className="text-right block">عنوان البريد</Label>
                    <Input
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label className="text-right block">محتوى البريد (HTML)</Label>
                    <Textarea
                      value={templateForm.body_html}
                      onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                      className="min-h-[200px] font-mono text-sm"
                      dir="ltr"
                    />
                  </div>

                  {/* Available Variables */}
                  <div className="space-y-2">
                    <Label className="text-right block text-sm text-muted-foreground">المتغيرات المتاحة:</Label>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {templateVariables[type.value]?.map((variable) => (
                        <Badge
                          key={variable.name}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(variable.name);
                            toast.info(`تم نسخ ${variable.name}`);
                          }}
                          title={variable.description}
                        >
                          {variable.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-start pt-4">
                    <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="gap-2">
                      {savingTemplate ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      حفظ القالب
                    </Button>

                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Eye className="w-4 h-4" />
                          معاينة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-right">معاينة البريد الإلكتروني</DialogTitle>
                          <DialogDescription className="text-right">
                            هذه معاينة تقريبية للبريد الإلكتروني
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">العنوان:</p>
                            <p className="font-medium">{templateForm.subject.replace(/\{\{[^}]+\}\}/g, (match) => {
                              const map: Record<string, string> = {
                                "{{company_name}}": company?.name || "اسم الشركة",
                                "{{total_products}}": "5",
                                "{{invoice_number}}": "INV-001",
                              };
                              return map[match] || match;
                            })}</p>
                          </div>
                          <div 
                            className="p-4 bg-white border rounded-lg"
                            dir="rtl"
                            dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" onClick={handleResetTemplate} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      إعادة تعيين
                    </Button>
                  </div>

                  {/* Template Status */}
                  {templates.find(t => t.template_type === type.value) && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-emerald-700">قالب مخصص محفوظ</span>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationSettings;
