import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  History,
  Loader2,
  Search,
  Download,
  Filter,
  User,
  Shield,
  UserPlus,
  UserMinus,
  Mail,
  Settings,
  RefreshCw,
} from "lucide-react";
import { getActionLabel, getTargetTypeLabel } from "@/utils/auditLog";
import { exportAuditLogsToExcel } from "@/utils/userExport";

interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

const actionIcons: Record<string, React.ReactNode> = {
  role_change: <Shield className="w-4 h-4" />,
  user_added: <UserPlus className="w-4 h-4" />,
  user_removed: <UserMinus className="w-4 h-4" />,
  invitation_sent: <Mail className="w-4 h-4" />,
  invitation_accepted: <UserPlus className="w-4 h-4" />,
  settings_updated: <Settings className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  role_change: "bg-blue-100 text-blue-800",
  user_added: "bg-green-100 text-green-800",
  user_removed: "bg-red-100 text-red-800",
  invitation_sent: "bg-purple-100 text-purple-800",
  invitation_accepted: "bg-emerald-100 text-emerald-800",
  settings_updated: "bg-amber-100 text-amber-800",
};

const AuditLogs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        const { data: companyUser } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (companyUser) {
          setCompanyId(companyUser.company_id);

          const { data: company } = await supabase
            .from("companies")
            .select("name")
            .eq("id", companyUser.company_id)
            .maybeSingle();

          if (company) {
            setCompanyName(company.name);
          }

          await fetchLogs(companyUser.company_id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("فشل في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const fetchLogs = async (compId: string) => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("company_id", compId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error fetching logs:", error);
      return;
    }

    // Fetch user profiles
    const logsWithProfiles: AuditLog[] = [];
    for (const log of data || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", log.user_id)
        .maybeSingle();

      logsWithProfiles.push({
        ...log,
        profile: profile || undefined,
      });
    }

    setLogs(logsWithProfiles);
    setFilteredLogs(logsWithProfiles);
  };

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.profile?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          getActionLabel(log.action_type).includes(searchTerm)
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action_type === actionFilter);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, actionFilter, logs]);

  const handleExport = () => {
    const exportData = filteredLogs.map((log) => ({
      action: log.action_type,
      targetType: log.target_type,
      oldValue: log.old_value ? JSON.stringify(log.old_value) : "",
      newValue: log.new_value ? JSON.stringify(log.new_value) : "",
      userName: log.profile?.full_name || "غير معروف",
      createdAt: format(new Date(log.created_at), "yyyy-MM-dd HH:mm", {
        locale: ar,
      }),
    }));

    exportAuditLogsToExcel(exportData, companyName);
    toast.success("تم تصدير سجل التدقيق بنجاح");
  };

  const handleRefresh = async () => {
    if (companyId) {
      setLoading(true);
      await fetchLogs(companyId);
      setLoading(false);
      toast.success("تم تحديث البيانات");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "؟";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
  };

  const formatValue = (value: unknown): string => {
    if (!value) return "-";
    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      if (obj.role) return getActionLabel(String(obj.role)) || String(obj.role);
      if (obj.email) return String(obj.email);
      if (obj.name) return String(obj.name);
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-7 h-7 text-primary" />
            سجل التدقيق
          </h1>
          <p className="text-muted-foreground mt-1">
            تتبع جميع الإجراءات والتغييرات المهمة في النظام
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي السجلات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action_type === "role_change").length}
                </p>
                <p className="text-sm text-muted-foreground">
                  تغييرات الصلاحيات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">
                  {
                    logs.filter((l) => l.action_type === "invitation_sent")
                      .length
                  }
                </p>
                <p className="text-sm text-muted-foreground">الدعوات المرسلة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action_type === "user_added").length}
                </p>
                <p className="text-sm text-muted-foreground">
                  المستخدمين المضافين
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في السجلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="فلترة حسب الإجراء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الإجراءات</SelectItem>
                  <SelectItem value="role_change">تغيير الصلاحية</SelectItem>
                  <SelectItem value="user_added">إضافة مستخدم</SelectItem>
                  <SelectItem value="user_removed">إزالة مستخدم</SelectItem>
                  <SelectItem value="invitation_sent">إرسال دعوة</SelectItem>
                  <SelectItem value="invitation_accepted">قبول دعوة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>سجل الإجراءات</CardTitle>
          <CardDescription>
            عرض {filteredLogs.length} من {logs.length} سجل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الإجراء</TableHead>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">التفاصيل</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge
                      className={`gap-1 ${
                        actionColors[log.action_type] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {actionIcons[log.action_type] || (
                        <User className="w-4 h-4" />
                      )}
                      {getActionLabel(log.action_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(log.profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{log.profile?.full_name || "غير معروف"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {getTargetTypeLabel(log.target_type)}:
                      </span>
                      {log.old_value && log.new_value ? (
                        <span className="mr-1">
                          <span className="line-through text-red-500">
                            {formatValue(log.old_value)}
                          </span>
                          {" → "}
                          <span className="text-green-600">
                            {formatValue(log.new_value)}
                          </span>
                        </span>
                      ) : log.new_value ? (
                        <span className="mr-1 text-green-600">
                          {formatValue(log.new_value)}
                        </span>
                      ) : (
                        <span className="mr-1">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd MMM yyyy - HH:mm", {
                        locale: ar,
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد سجلات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AuditLogs;
