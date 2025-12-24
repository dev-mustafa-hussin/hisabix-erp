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
          log.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      createdAt: format(new Date(log.created_at), "yyyy-MM-dd HH:mm", { locale: ar }),
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
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
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
      {/* ... (rest of the content) */}
    </DashboardLayout>
  );
  );
};

export default AuditLogs;
