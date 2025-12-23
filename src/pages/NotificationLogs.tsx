import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  History,
  Mail,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  RefreshCw,
  Filter,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationLog {
  id: string;
  company_id: string;
  notification_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const NotificationLogs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyEmail, setCompanyEmail] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!companyId) return;

    setLoading(true);

    let query = supabase
      .from("notification_logs")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterType !== "all") {
      query = query.eq("notification_type", filterType);
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setLogs((data as NotificationLog[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    const getCompanyId = async () => {
      if (!user?.id) return;

      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (companyUser) {
        setCompanyId(companyUser.company_id);
        
        // Fetch company details
        const { data: company } = await supabase
          .from("companies")
          .select("name, email")
          .eq("id", companyUser.company_id)
          .maybeSingle();
        
        if (company) {
          setCompanyName(company.name || "");
          setCompanyEmail(company.email || "");
        }
      }
    };

    getCompanyId();
  }, [user?.id]);

  useEffect(() => {
    if (companyId) {
      fetchLogs();
    }
  }, [companyId, filterType, filterStatus]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "stock_alert":
        return <Package className="w-4 h-4" />;
      case "invoice_reminder":
        return <FileText className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "stock_alert":
        return "تنبيه المخزون";
      case "invoice_reminder":
        return "تذكير الفاتورة";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "sent") {
      return (
        <Badge className="gap-1 bg-emerald-500/20 text-emerald-600 border-0">
          <CheckCircle className="w-3 h-3" />
          تم الإرسال
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        فشل
      </Badge>
    );
  };

  const handleResend = async (log: NotificationLog) => {
    if (!companyId) return;

    setResending(log.id);

    try {
      if (log.notification_type === "stock_alert") {
        const { data, error } = await supabase.functions.invoke("send-stock-alert", {
          body: {
            company_id: companyId,
            recipient_email: log.recipient_email,
            company_name: companyName,
          },
        });

        if (error) throw error;
        toast.success("تم إعادة إرسال تنبيه المخزون بنجاح");
      } else if (log.notification_type === "invoice_reminder") {
        const invoiceId = (log.metadata as Record<string, unknown>)?.invoice_id as string;
        
        if (!invoiceId) {
          toast.error("لا يمكن إعادة الإرسال - معرف الفاتورة غير موجود");
          return;
        }

        const { data, error } = await supabase.functions.invoke("send-invoice-reminder", {
          body: {
            invoiceId,
          },
        });

        if (error) throw error;
        toast.success("تم إعادة إرسال تذكير الفاتورة بنجاح");
      }

      // Refresh logs
      fetchLogs();
    } catch (error: any) {
      console.error("Error resending notification:", error);
      toast.error("فشل في إعادة الإرسال: " + (error.message || "خطأ غير معروف"));
    } finally {
      setResending(null);
    }
  };

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === "sent").length,
    failed: logs.filter((l) => l.status === "failed").length,
    stockAlerts: logs.filter((l) => l.notification_type === "stock_alert").length,
    invoiceReminders: logs.filter((l) => l.notification_type === "invoice_reminder").length,
  };

  if (loading && logs.length === 0) {
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
          <Button onClick={fetchLogs} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            سجل الإشعارات
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">تم إرسالها</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">فشلت</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.stockAlerts}</p>
                <p className="text-sm text-muted-foreground">تنبيهات المخزون</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.invoiceReminders}</p>
                <p className="text-sm text-muted-foreground">تذكيرات الفواتير</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              تصفية السجلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-end">
              <div className="w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="sent">تم الإرسال</SelectItem>
                    <SelectItem value="failed">فشل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="stock_alert">تنبيهات المخزون</SelectItem>
                    <SelectItem value="invoice_reminder">تذكيرات الفواتير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">سجل الإشعارات المرسلة</CardTitle>
            <CardDescription className="text-right">
              جميع الإشعارات المرسلة من النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد إشعارات مرسلة بعد</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-32">الإجراءات</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">المستلم</TableHead>
                    <TableHead className="text-center">النوع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="text-right">
                                تفاصيل الإشعار
                              </DialogTitle>
                              <DialogDescription className="text-right">
                                معلومات تفصيلية عن الإشعار المرسل
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">
                                      النوع
                                    </p>
                                    <p className="font-medium flex items-center gap-2 justify-end">
                                      {getTypeName(selectedLog.notification_type)}
                                      {getTypeIcon(selectedLog.notification_type)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">
                                      الحالة
                                    </p>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedLog.status)}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    المستلم
                                  </p>
                                  <p className="font-medium">
                                    {selectedLog.recipient_email}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    العنوان
                                  </p>
                                  <p className="font-medium">{selectedLog.subject}</p>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    التاريخ والوقت
                                  </p>
                                  <p className="font-medium">
                                    {format(
                                      new Date(selectedLog.created_at),
                                      "dd/MM/yyyy HH:mm:ss",
                                      { locale: ar }
                                    )}
                                  </p>
                                </div>

                                {selectedLog.error_message && (
                                  <div className="text-right p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                      رسالة الخطأ
                                    </p>
                                    <p className="font-medium text-red-600">
                                      {selectedLog.error_message}
                                    </p>
                                  </div>
                                )}

                                {selectedLog.metadata && (
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground mb-2">
                                      بيانات إضافية
                                    </p>
                                    <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                                      {selectedLog.notification_type === "stock_alert" && (
                                        <>
                                          <p className="text-sm">
                                            <span className="text-muted-foreground">
                                              منتجات نافذة:{" "}
                                            </span>
                                            {(selectedLog.metadata as Record<string, unknown>)?.out_of_stock_count as number || 0}
                                          </p>
                                          <p className="text-sm">
                                            <span className="text-muted-foreground">
                                              منتجات منخفضة:{" "}
                                            </span>
                                            {(selectedLog.metadata as Record<string, unknown>)?.low_stock_count as number || 0}
                                          </p>
                                        </>
                                      )}
                                      {selectedLog.notification_type === "invoice_reminder" && (
                                        <>
                                          <p className="text-sm">
                                            <span className="text-muted-foreground">
                                              رقم الفاتورة:{" "}
                                            </span>
                                            {(selectedLog.metadata as Record<string, unknown>)?.invoice_number as string || "-"}
                                          </p>
                                          <p className="text-sm">
                                            <span className="text-muted-foreground">
                                              اسم العميل:{" "}
                                            </span>
                                            {(selectedLog.metadata as Record<string, unknown>)?.customer_name as string || "-"}
                                          </p>
                                          <p className="text-sm">
                                            <span className="text-muted-foreground">
                                              المبلغ المتبقي:{" "}
                                            </span>
                                            {(selectedLog.metadata as Record<string, unknown>)?.remaining as number || 0} جنيه
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {log.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResend(log)}
                            disabled={resending === log.id}
                            title="إعادة الإرسال"
                          >
                            {resending === log.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4 text-amber-600" />
                            )}
                          </Button>
                        )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell className="text-right max-w-xs truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.recipient_email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          {getTypeIcon(log.notification_type)}
                          {getTypeName(log.notification_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ar,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationLogs;