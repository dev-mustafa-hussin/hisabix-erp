import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Users as UsersIcon,
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
  Printer,
  Eye,
  IdCard,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { createAuditLog } from "@/utils/auditLog";
import { exportUsersToExcel } from "@/utils/userExport";

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
    username?: string | null;
  };
  email?: string;
}

interface Company {
  id: string;
  name: string;
}

const roleLabels: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  admin: {
    label: "Admin",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <Shield className="w-3 h-3" />,
  },
  moderator: {
    label: "Moderator",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <UsersIcon className="w-3 h-3" />,
  },
  user: {
    label: "User",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <UsersIcon className="w-3 h-3" />,
  },
};

const Users = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CompanyUser[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    username: true,
    name: true,
    role: true,
    email: true,
    actions: true,
  });

  // Dialogs
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "moderator" | "user">(
    "user"
  );
  const [inviting, setInviting] = useState(false);

  // ID Card State
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [selectedUserForCard, setSelectedUserForCard] =
    useState<CompanyUser | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setLoading(true);

      try {
        // 1. Check if user is linked to any company
        const { data: companyUser, error: fetchError } = await supabase
          .from("company_users")
          .select("company_id, role, is_owner")
          .eq("user_id", user.id)
          .maybeSingle();

        if (companyUser) {
          setCompanyId(companyUser.company_id);
          setIsOwner(companyUser.is_owner || false);
          setIsAdmin(companyUser.role === "admin" || companyUser.is_owner);

          const { data: companyData } = await supabase
            .from("companies")
            .select("id, name")
            .eq("id", companyUser.company_id)
            .maybeSingle();

          if (companyData) setCompany(companyData);
          await fetchCompanyUsers(companyUser.company_id);
        } else {
          // --- SELF REPAIR LOGIC START (DATABASE RPC) ---
          console.log("No company link found. Invoking database repair...");
          toast.info("جاري تهيئة حسابك لأول مرة...");

          const { data: repairResult, error: repairError } = await supabase.rpc(
            "repair_my_account"
          );

          if (repairError) {
            console.error("Database repair failed:", repairError);
            toast.error("فشل تهيئة الحساب. يرجى التواصل مع الدعم.");
            return;
          }

          if (repairResult && (repairResult as any).success) {
            toast.success("تم إعداد حسابك بنجاح!");
            // Re-fetch data instead of reload to prevent infinite loop
            fetchData();
          }
          // --- SELF REPAIR LOGIC END ---
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  useEffect(() => {
    let result = companyUsers;
    if (search) {
      result = companyUsers.filter(
        (u) =>
          u.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.profile?.username?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [search, companyUsers]);

  const fetchCompanyUsers = async (compId: string) => {
    const { data: users, error } = await supabase
      .from("company_users")
      .select("*")
      .eq("company_id", compId)
      .order("created_at", { ascending: true });

    if (error) return;

    const usersWithProfiles: CompanyUser[] = [];
    for (const u of users || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone, username")
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
    if (!inviteEmail.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!companyId || !company?.name) {
      toast.error("بيانات الشركة غير متوفرة");
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-invitation",
        {
          body: {
            email: inviteEmail,
            role: inviteRole,
            company_id: companyId,
            company_name: company.name,
            inviter_name: user?.role === "authenticated" ? "Admin" : "Someone", // Fallback, simpler to get from profile if needed
          },
        }
      );

      if (error) throw error;

      toast.success("تم إرسال الدعوة بنجاح");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("user");
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error(error.message || "فشل إرسال الدعوة");
    } finally {
      setInviting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShowIdCard = (user: CompanyUser) => {
    setSelectedUserForCard(user);
    setIdCardOpen(true);
  };

  // Pagination Logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredUsers.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6 print-container">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            المستخدمين{" "}
            <span className="text-muted-foreground text-sm font-normal">
              إدارة المستخدمين
            </span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-primary">الرئيسية</span>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-primary font-medium">إدارة المستخدمين</span>
          </div>
        </div>

        <Card className="border-0 shadow-sm print:shadow-none print:border">
          <CardHeader className="bg-white border-b p-4 no-print">
            <div className="flex items-center justify-between">
              <CardTitle>جميع المستخدمين</CardTitle>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4" />
                    إضافة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات المستخدم الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الصلاحية</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v: any) => setInviteRole(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button onClick={handleInviteUser} disabled={inviting}>
                      {inviting && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      حفظ
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-white p-1 no-print">
              <div className="flex items-center gap-2">
                <span className="text-sm">عرض</span>
                <Select
                  value={entriesPerPage.toString()}
                  onValueChange={(v) => setEntriesPerPage(Number(v))}
                >
                  <SelectTrigger className="w-[70px] h-9">
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm">إدخالات</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Export Buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() =>
                    exportUsersToExcel(
                      companyUsers.map((u) => ({ ...u, ...u.profile })),
                      "users"
                    )
                  }
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  تصدير إلى CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() =>
                    exportUsersToExcel(
                      companyUsers.map((u) => ({ ...u, ...u.profile })),
                      "users"
                    )
                  }
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  تصدير إلى Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>

                {/* Column Visibility */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      رؤية العمود
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.select}
                      onCheckedChange={(c) =>
                        setVisibleColumns({ ...visibleColumns, select: !!c })
                      }
                    >
                      Select
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.username}
                      onCheckedChange={(c) =>
                        setVisibleColumns({ ...visibleColumns, username: !!c })
                      }
                    >
                      اسم المستخدم
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.name}
                      onCheckedChange={(c) =>
                        setVisibleColumns({ ...visibleColumns, name: !!c })
                      }
                    >
                      الإسم
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.role}
                      onCheckedChange={(c) =>
                        setVisibleColumns({ ...visibleColumns, role: !!c })
                      }
                    >
                      الصلاحية
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.email}
                      onCheckedChange={(c) =>
                        setVisibleColumns({ ...visibleColumns, email: !!c })
                      }
                    >
                      البريد الإلكتروني
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.actions}
                      onCheckedChange={(c) =>
                        setVisibleColumns({ ...visibleColumns, actions: !!c })
                      }
                    >
                      خيار
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    {visibleColumns.select && (
                      <TableHead className="w-[50px] text-center no-print">
                        <Checkbox
                          checked={
                            filteredUsers.length > 0 &&
                            selectedUsers.length === filteredUsers.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    {visibleColumns.username && (
                      <TableHead className="text-right">اسم المستخدم</TableHead>
                    )}
                    {visibleColumns.name && (
                      <TableHead className="text-right">الإسم</TableHead>
                    )}
                    {visibleColumns.role && (
                      <TableHead className="text-center">الصلاحية</TableHead>
                    )}
                    {visibleColumns.email && (
                      <TableHead className="text-center">
                        البريد الإلكتروني
                      </TableHead>
                    )}
                    {visibleColumns.actions && (
                      <TableHead className="text-center no-print">
                        خيار
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : currentEntries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        لا توجد بيانات متاحة
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentEntries.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50/50">
                        {visibleColumns.select && (
                          <TableCell className="text-center no-print">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleSelectUser(user.id)}
                            />
                          </TableCell>
                        )}
                        {visibleColumns.username && (
                          <TableCell className="font-medium">
                            {user.profile?.username ||
                              user.profile?.full_name?.split(" ")[0] ||
                              "مستخدم"}
                          </TableCell>
                        )}
                        {visibleColumns.name && (
                          <TableCell>
                            {user.profile?.full_name || "غير محدد"}
                          </TableCell>
                        )}
                        {visibleColumns.role && (
                          <TableCell className="text-center">
                            <Badge
                              className={`bg-transparent text-gray-700 hover:bg-transparent font-normal text-sm ${
                                roleLabels[user.role]?.color
                              }`}
                            >
                              {roleLabels[user.role]?.label || user.role}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.email && (
                          <TableCell className="text-center text-muted-foreground">
                            {user.email || "-"}
                          </TableCell>
                        )}
                        {visibleColumns.actions && (
                          <TableCell className="no-print">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 gap-1 rounded-full"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                تعديل
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-cyan-600 border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 gap-1 rounded-full"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                فحص
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 gap-1 rounded-full"
                                onClick={() => handleShowIdCard(user)}
                              >
                                <IdCard className="w-3.5 h-3.5" />
                                ID
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1 rounded-full"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                حذف
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 no-print">
              <div className="text-sm text-muted-foreground">
                عرض {indexOfFirstEntry + 1} إلى{" "}
                {Math.min(indexOfLastEntry, filteredUsers.length)} من{" "}
                {filteredUsers.length} إدخالات
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className={`w-8 h-8 p-0 ${
                          currentPage === page
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ID Card Dialog */}
        <Dialog open={idCardOpen} onOpenChange={setIdCardOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>بطاقة المستخدم</DialogTitle>
            </DialogHeader>
            {selectedUserForCard && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={selectedUserForCard.profile?.avatar_url || ""}
                  />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {selectedUserForCard.profile?.full_name
                      ?.slice(0, 2)
                      .toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">
                    {selectedUserForCard.profile?.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUserForCard.email}
                  </p>
                  <Badge className="mt-2">{selectedUserForCard.role}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-4 border-t pt-4">
                  <div className="text-center p-2 bg-gray-50 rounded text-sm">
                    <p className="text-muted-foreground">رقم الهاتف</p>
                    <p className="font-medium">
                      {selectedUserForCard.profile?.phone || "-"}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded text-sm">
                    <p className="text-muted-foreground">تاريخ الانضمام</p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedUserForCard.created_at),
                        "yyyy/MM/dd"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Users;
