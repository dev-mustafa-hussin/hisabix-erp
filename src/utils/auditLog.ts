import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface AuditLogParams {
  companyId: string;
  userId: string;
  actionType: string;
  targetType: string;
  targetId?: string;
  oldValue?: Json;
  newValue?: Json;
}

export const createAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    const { error } = await supabase
      .from("audit_logs")
      .insert([{
        company_id: params.companyId,
        user_id: params.userId,
        action_type: params.actionType,
        target_type: params.targetType,
        target_id: params.targetId || null,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        user_agent: navigator.userAgent,
      }]);

    if (error) {
      console.error("Error creating audit log:", error);
    }
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
};

export const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    role_change: "تغيير الصلاحية",
    user_added: "إضافة مستخدم",
    user_removed: "إزالة مستخدم",
    invitation_sent: "إرسال دعوة",
    invitation_accepted: "قبول دعوة",
    invitation_cancelled: "إلغاء دعوة",
    settings_updated: "تحديث الإعدادات",
    login: "تسجيل دخول",
    logout: "تسجيل خروج",
  };
  return labels[action] || action;
};

export const getTargetTypeLabel = (targetType: string): string => {
  const labels: Record<string, string> = {
    user: "مستخدم",
    invitation: "دعوة",
    company: "شركة",
    settings: "إعدادات",
    role: "صلاحية",
  };
  return labels[targetType] || targetType;
};
