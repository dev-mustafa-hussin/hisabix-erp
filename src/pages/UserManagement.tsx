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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  Loader2,
  Trash2,
  Edit,
  Mail,
  Calendar,
  Building2,
  Download,
  History,
  Clock,
  X,
} from "lucide-react";
import { createAuditLog } from "@/utils/auditLog";
import { exportUsersToExcel } from "@/utils/userExport";
import { Link } from "react-router-dom";

interface CompanyUser {
  id: string;
  user_id: string;
  company_id: string;
  role: "admin" | "moderator" | "user";
  is_owner: boolean;
  created_at: string;
  expires_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  };
  email?: string;
}

interface Company {
  id: string;
  name: string;
}

const roleLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "مدير", color: "bg-red-100 text-red-800 border-red-200", icon: <Shield className="w-3 h-3" /> },
  moderator: { label: "مشرف", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Users className="w-3 h-3" /> },
  user: { label: "مستخدم", color: "bg-gray-100 text-gray-800 border-gray-200", icon: <Users className="w-3 h-3" /> },
};

const UserManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Invite user dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "moderator" | "user">("user");
  const [inviting, setInviting] = useState(false);

  // Edit user dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "moderator" | "user">("user");
  const [editExpiresAt, setEditExpiresAt] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Delete user
  const [deleting, setDeleting] = useState(false);

  // Invitations
  const [invitations, setInvitations] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        // Get company
        const { data: companyUser } = await supabase
          .from("company_users")
          .select("company_id, role, is_owner")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (companyUser) {
          setCompanyId(companyUser.company_id);
          setIsOwner(companyUser.is_owner || false);
          setIsAdmin(companyUser.role === "admin" || companyUser.is_owner);

          // Fetch company details
          const { data: companyData } = await supabase
            .from("companies")
            .select("id, name")
            .eq("id", companyUser.company_id)
            .maybeSingle();

          if (companyData) {
            setCompany(companyData);
          }

          // Fetch all company users
          await fetchCompanyUsers(companyUser.company_id);
          
          // Fetch pending invitations
          const { data: invData } = await supabase
            .from("user_invitations")
            .select("*")
            .eq("company_id", companyUser.company_id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });
          
          setInvitations(invData || []);
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

  const fetchCompanyUsers = async (compId: string) => {
    const { data: users, error } = await supabase
      .from("company_users")
      .select(`
        id,
        user_id,
        company_id,
        role,
        is_owner,
        created_at,
        expires_at
      `)
      .eq("company_id", compId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    // Fetch profiles for each user
    const usersWithProfiles: CompanyUser[] = [];
    for (const u of users || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone")
        .eq("user_id", u.user_id)
        .maybeSingle();

      usersWithProfiles.push({
        ...u,
        role: u.role as "admin" | "moderator" | "user",
        expires_at: u.expires_at || null,
        profile: profile || undefined,
      });
    }

    setCompanyUsers(usersWithProfiles);
  };

  const handleInviteUser = async () => {
    if (!companyId || !inviteEmail.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    setInviting(true);

    try {
      // Get inviter name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user?.id)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: inviteEmail.trim(),
          role: inviteRole,
          company_id: companyId,
          company_name: company?.name || "",
          inviter_name: profile?.full_name || "مستخدم",
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error === "invitation_exists") {
          toast.error(data.message);
        } else {
          throw new Error(data.error);
        }
      } else {
        toast.success("تم إرسال الدعوة بنجاح");
        setInviteOpen(false);
        setInviteEmail("");
        setInviteRole("user");
        await fetchInvitations();
      }
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast.error("فشل في إرسال الدعوة");
    } finally {
      setInviting(false);
    }
  };

  const fetchInvitations = async () => {
    if (!companyId) return;
    
    const { data } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    setInvitations(data || []);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("user_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("تم إلغاء الدعوة");
      await fetchInvitations();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error("فشل في إلغاء الدعوة");
    }
  };

  const handleExportUsers = () => {
    const exportData = companyUsers.map((u) => ({
      name: u.profile?.full_name || "غير محدد",
      email: u.email,
      phone: u.profile?.phone || undefined,
      role: u.role,
      isOwner: u.is_owner,
      joinedAt: format(new Date(u.created_at), "yyyy-MM-dd", { locale: ar }),
    }));

    exportUsersToExcel(exportData, company?.name || "company");
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleEditUser = (companyUser: CompanyUser) => {
    setEditingUser(companyUser);
    setEditRole(companyUser.role);
    setEditExpiresAt(companyUser.expires_at ? companyUser.expires_at.split('T')[0] : "");
    setEditOpen(true);
  };

  const handleSaveRole = async () => {
    if (!editingUser || !companyId || !user?.id) return;

    setSaving(true);

    try {
      const oldRole = editingUser.role;
      const oldExpiresAt = editingUser.expires_at;
      const newExpiresAt = editExpiresAt ? new Date(editExpiresAt).toISOString() : null;
      
      const { error } = await supabase
        .from("company_users")
        .update({ 
          role: editRole,
          expires_at: newExpiresAt,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      // Create audit log
      await createAuditLog({
        companyId,
        userId: user.id,
        actionType: "role_change",
        targetType: "user",
        targetId: editingUser.user_id,
        oldValue: { role: oldRole, expires_at: oldExpiresAt, name: editingUser.profile?.full_name },
        newValue: { role: editRole, expires_at: newExpiresAt, name: editingUser.profile?.full_name },
      });

      toast.success("تم تحديث بيانات المستخدم بنجاح");
      setEditOpen(false);
      setEditingUser(null);

      await fetchCompanyUsers(companyId);
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("فشل في تحديث الصلاحية");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUser = async (companyUser: CompanyUser) => {
    if (companyUser.is_owner) {
      toast.error("لا يمكن إزالة مالك الشركة");
      return;
    }

    if (companyUser.user_id === user?.id) {
      toast.error("لا يمكنك إزالة نفسك");
      return;
    }

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("company_users")
        .delete()
        .eq("id", companyUser.id);

      if (error) throw error;

      toast.success("تم إزالة المستخدم بنجاح");

      if (companyId) {
        await fetchCompanyUsers(companyId);
      }
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("فشل في إزالة المستخدم");
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "؟";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6 overflow-auto" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-7 h-7 text-primary" />
                إدارة المستخدمين
              </h1>
              <p className="text-muted-foreground mt-1">
                إدارة أعضاء الفريق وصلاحياتهم في {company?.name}
              </p>
            </div>

            {(isOwner || isAdmin) && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    دعوة مستخدم
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-right">دعوة مستخدم جديد</DialogTitle>
                    <DialogDescription className="text-right">
                      أضف مستخدم جديد إلى فريق العمل
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-right block">البريد الإلكتروني</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="text-left"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-right block">الصلاحية</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">مستخدم</SelectItem>
                          <SelectItem value="moderator">مشرف</SelectItem>
                          <SelectItem value="admin">مدير</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setInviteOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleInviteUser} disabled={inviting}>
                      {inviting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                      إرسال الدعوة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">{companyUsers.length}</p>
                    <p className="text-sm text-muted-foreground">إجمالي الأعضاء</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">
                      {companyUsers.filter(u => u.role === "admin").length}
                    </p>
                    <p className="text-sm text-muted-foreground">المدراء</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">
                      {companyUsers.filter(u => u.role === "moderator").length}
                    </p>
                    <p className="text-sm text-muted-foreground">المشرفين</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">
                      {companyUsers.filter(u => u.is_owner).length}
                    </p>
                    <p className="text-sm text-muted-foreground">المالك</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                أعضاء الفريق
              </CardTitle>
              <CardDescription>
                قائمة بجميع أعضاء الفريق وصلاحياتهم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">الصلاحية</TableHead>
                    <TableHead className="text-right">تاريخ الانضمام</TableHead>
                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    {(isOwner || isAdmin) && (
                      <TableHead className="text-center">الإجراءات</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyUsers.map((companyUser) => (
                    <TableRow key={companyUser.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={companyUser.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(companyUser.profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {companyUser.profile?.full_name || "مستخدم"}
                              {companyUser.user_id === user?.id && (
                                <span className="text-xs text-muted-foreground mr-2">(أنت)</span>
                              )}
                            </p>
                            {companyUser.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {companyUser.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {companyUser.is_owner && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
                              <Crown className="w-3 h-3" />
                              المالك
                            </Badge>
                          )}
                          <Badge className={`${roleLabels[companyUser.role].color} gap-1`}>
                            {roleLabels[companyUser.role].icon}
                            {roleLabels[companyUser.role].label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(companyUser.created_at), "dd MMM yyyy", { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {companyUser.expires_at ? (
                          <div className={`flex items-center gap-1 ${new Date(companyUser.expires_at) < new Date() ? 'text-destructive' : 'text-amber-600'}`}>
                            <Clock className="w-4 h-4" />
                            {format(new Date(companyUser.expires_at), "dd MMM yyyy", { locale: ar })}
                            {new Date(companyUser.expires_at) < new Date() && (
                              <Badge variant="destructive" className="mr-1 text-xs">منتهي</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {companyUser.profile?.phone || "-"}
                      </TableCell>
                      {(isOwner || isAdmin) && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!companyUser.is_owner && companyUser.user_id !== user?.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditUser(companyUser)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-right">
                                        إزالة المستخدم
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-right">
                                        هل أنت متأكد من إزالة {companyUser.profile?.full_name || "هذا المستخدم"} من الشركة؟
                                        لن يتمكن من الوصول إلى بيانات الشركة بعد ذلك.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2">
                                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveUser(companyUser)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {deleting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                        إزالة
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {companyUser.is_owner && (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                            {companyUser.user_id === user?.id && !companyUser.is_owner && (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {companyUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا يوجد أعضاء في الفريق</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                شرح الصلاحيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">مدير (Admin)</h3>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    <li>الوصول الكامل لجميع الميزات</li>
                    <li>إدارة المستخدمين والصلاحيات</li>
                    <li>تعديل إعدادات الشركة</li>
                    <li>حذف وتعديل جميع البيانات</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">مشرف (Moderator)</h3>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>إنشاء وتعديل الفواتير والمبيعات</li>
                    <li>إدارة المنتجات والمخزون</li>
                    <li>عرض التقارير</li>
                    <li>لا يمكنه إدارة المستخدمين</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">مستخدم (User)</h3>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>عرض البيانات فقط</li>
                    <li>إنشاء مبيعات جديدة</li>
                    <li>لا يمكنه التعديل أو الحذف</li>
                    <li>وصول محدود للتقارير</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">تعديل صلاحية المستخدم</DialogTitle>
            <DialogDescription className="text-right">
              تغيير صلاحية {editingUser?.profile?.full_name || "المستخدم"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-right block">الصلاحية الجديدة</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="moderator">مشرف</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-right block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                تاريخ انتهاء الصلاحية (اختياري)
              </Label>
              <Input
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="text-left"
                dir="ltr"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                اتركه فارغاً إذا كنت لا تريد تحديد تاريخ انتهاء
              </p>
              {editExpiresAt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditExpiresAt("")}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 ml-1" />
                  إزالة تاريخ الانتهاء
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
