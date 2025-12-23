import * as XLSX from "xlsx";

interface ExportUser {
  name: string;
  email?: string;
  phone?: string;
  role: string;
  isOwner: boolean;
  joinedAt: string;
}

export const exportUsersToExcel = (users: ExportUser[], companyName: string) => {
  const data = users.map((user, index) => ({
    "#": index + 1,
    "الاسم": user.name || "غير محدد",
    "البريد الإلكتروني": user.email || "-",
    "الهاتف": user.phone || "-",
    "الصلاحية": getRoleLabel(user.role),
    "المالك": user.isOwner ? "نعم" : "لا",
    "تاريخ الانضمام": user.joinedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  worksheet["!cols"] = [
    { wch: 5 },   // #
    { wch: 25 },  // الاسم
    { wch: 30 },  // البريد الإلكتروني
    { wch: 15 },  // الهاتف
    { wch: 12 },  // الصلاحية
    { wch: 8 },   // المالك
    { wch: 15 },  // تاريخ الانضمام
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "المستخدمين");
  
  const fileName = `users_${companyName}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: "مدير",
    moderator: "مشرف",
    user: "مستخدم",
  };
  return labels[role] || role;
};

interface AuditLog {
  action: string;
  targetType: string;
  oldValue: string;
  newValue: string;
  userName: string;
  createdAt: string;
}

export const exportAuditLogsToExcel = (logs: AuditLog[], companyName: string) => {
  const data = logs.map((log, index) => ({
    "#": index + 1,
    "الإجراء": getActionLabel(log.action),
    "النوع": getTargetTypeLabel(log.targetType),
    "القيمة السابقة": log.oldValue || "-",
    "القيمة الجديدة": log.newValue || "-",
    "المستخدم": log.userName,
    "التاريخ": log.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "سجل التدقيق");
  
  const fileName = `audit_logs_${companyName}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    role_change: "تغيير الصلاحية",
    user_added: "إضافة مستخدم",
    user_removed: "إزالة مستخدم",
    invitation_sent: "إرسال دعوة",
    invitation_accepted: "قبول دعوة",
    settings_updated: "تحديث الإعدادات",
  };
  return labels[action] || action;
};

const getTargetTypeLabel = (targetType: string): string => {
  const labels: Record<string, string> = {
    user: "مستخدم",
    invitation: "دعوة",
    company: "شركة",
    settings: "إعدادات",
  };
  return labels[targetType] || targetType;
};
