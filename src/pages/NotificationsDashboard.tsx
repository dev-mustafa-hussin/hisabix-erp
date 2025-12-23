import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Bell,
  CheckCircle,
  XCircle,
  Mail,
  TrendingUp,
  Clock,
  RefreshCw,
  Loader2,
  Package,
  FileText,
  AlertTriangle,
  Activity,
  Calendar,
  Send,
  BarChart3,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface NotificationLog {
  id: string;
  notification_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
  metadata: any;
}

interface DailyStats {
  date: string;
  sent: number;
  failed: number;
}

interface TypeStats {
  type: string;
  label: string;
  count: number;
  success: number;
  failed: number;
}

const NotificationsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [dateRange, setDateRange] = useState("30");
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    successRate: 0,
    todaySent: 0,
    weekSent: 0,
  });
  
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStats[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchNotifications();
    }
  }, [companyId, dateRange]);

  const fetchCompanyId = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCompanyId(data.company_id);
    }
  };

  const fetchNotifications = async () => {
    if (!companyId) return;
    setLoading(true);

    const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();

    const { data, error } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("company_id", companyId)
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    calculateStats(data || []);
    setLoading(false);
  };

  const calculateStats = (logs: NotificationLog[]) => {
    const total = logs.length;
    const sent = logs.filter(l => l.status === "sent").length;
    const failed = logs.filter(l => l.status === "failed").length;
    const successRate = total > 0 ? (sent / total) * 100 : 0;

    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);
    
    const todaySent = logs.filter(l => 
      l.status === "sent" && new Date(l.created_at) >= today
    ).length;
    
    const weekSent = logs.filter(l => 
      l.status === "sent" && new Date(l.created_at) >= weekAgo
    ).length;

    setStats({ total, sent, failed, successRate, todaySent, weekSent });

    // Status distribution
    setStatusDistribution([
      { name: "تم الإرسال", value: sent, color: "#22c55e" },
      { name: "فشل", value: failed, color: "#ef4444" },
    ]);

    // Daily stats
    const dailyMap: { [key: string]: { sent: number; failed: number } } = {};
    logs.forEach(log => {
      const date = format(new Date(log.created_at), "MM/dd");
      if (!dailyMap[date]) {
        dailyMap[date] = { sent: 0, failed: 0 };
      }
      if (log.status === "sent") {
        dailyMap[date].sent++;
      } else {
        dailyMap[date].failed++;
      }
    });

    const dailyData = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .reverse();
    setDailyStats(dailyData);

    // Type stats
    const typeMap: { [key: string]: { count: number; success: number; failed: number } } = {};
    logs.forEach(log => {
      const type = log.notification_type;
      if (!typeMap[type]) {
        typeMap[type] = { count: 0, success: 0, failed: 0 };
      }
      typeMap[type].count++;
      if (log.status === "sent") {
        typeMap[type].success++;
      } else {
        typeMap[type].failed++;
      }
    });

    const typeLabels: { [key: string]: string } = {
      stock_alert: "تنبيه المخزون",
      stock_alert_scheduled: "تنبيه مخزون مجدول",
      invoice_reminder: "تذكير فاتورة",
      movement_change_alert: "تنبيه تغيير الحركة",
      movement_change_alert_scheduled: "تنبيه تغيير مجدول",
    };

    const typeData = Object.entries(typeMap).map(([type, data]) => ({
      type,
      label: typeLabels[type] || type,
      ...data,
    }));
    setTypeStats(typeData);
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case "stock_alert":
      case "stock_alert_scheduled":
        return <Package className="w-4 h-4" />;
      case "invoice_reminder":
        return <FileText className="w-4 h-4" />;
      case "movement_change_alert":
      case "movement_change_alert_scheduled":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      stock_alert: "تنبيه مخزون",
      stock_alert_scheduled: "تنبيه مخزون مجدول",
      invoice_reminder: "تذكير فاتورة",
      movement_change_alert: "تنبيه تغيير",
      movement_change_alert_scheduled: "تنبيه تغيير مجدول",
    };
    return labels[type] || type;
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
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="60">آخر 60 يوم</SelectItem>
                <SelectItem value="90">آخر 90 يوم</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchNotifications} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Button onClick={() => navigate("/notification-logs")} variant="outline" className="gap-2">
              <Activity className="w-4 h-4" />
              سجل الإشعارات
            </Button>
          </div>
          <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            لوحة تحكم الإشعارات
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">تم الإرسال</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">فشل</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">نسبة النجاح</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">اليوم</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.todaySent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">آخر 7 أيام</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.weekSent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Daily Trend Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-right">اتجاه الإشعارات اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="sent" 
                      name="تم الإرسال" 
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.3} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="failed" 
                      name="فشل" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات في الفترة المحددة
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">توزيع الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Type Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">إحصائيات حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            {typeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" name="نجاح" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="failed" name="فشل" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="link" 
                onClick={() => navigate("/notification-logs")}
                className="text-primary"
              >
                عرض الكل
              </Button>
              <CardTitle className="text-right">آخر الإشعارات</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                  <TableHead className="text-center">البريد</TableHead>
                  <TableHead className="text-center">النوع</TableHead>
                  <TableHead className="text-right">الموضوع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.slice(0, 10).map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="text-center">
                      {notification.status === "sent" ? (
                        <Badge className="gap-1 bg-emerald-500/20 text-emerald-600 border-0">
                          <CheckCircle className="w-3 h-3" />
                          تم
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          فشل
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {notification.recipient_email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        {getNotificationTypeIcon(notification.notification_type)}
                        {getNotificationTypeLabel(notification.notification_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right max-w-xs truncate">
                      {notification.subject}
                    </TableCell>
                  </TableRow>
                ))}
                {notifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد إشعارات في الفترة المحددة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-end">
              <Button 
                variant="outline" 
                onClick={() => navigate("/notification-settings")}
                className="gap-2"
              >
                <Bell className="w-4 h-4" />
                إعدادات الإشعارات
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/notification-logs")}
                className="gap-2"
              >
                <Activity className="w-4 h-4" />
                سجل الإشعارات
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/inventory-report")}
                className="gap-2"
              >
                <Package className="w-4 h-4" />
                تقرير المخزون
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationsDashboard;
