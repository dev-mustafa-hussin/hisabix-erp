import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Lock } from "lucide-react";

const Permissions = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          إدارة الصلاحيات
        </h1>
        <p className="text-muted-foreground">
          نظرة عامة على صلاحيات الأدوار في النظام. يمكن للمدراء فقط تعديل هذه
          الإعدادات.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              مصفوفة الصلاحيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Admin */}
              <div className="border rounded-lg p-4 bg-red-50/50 border-red-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-bold text-lg text-red-900">
                    مدير (Admin)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    تحكم كامل في النظام
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    إدارة المستخدمين والفروع
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    الوصول لجميع التقارير
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    تعديل إعدادات الشركة
                  </li>
                </ul>
              </div>

              {/* Moderator */}
              <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg text-blue-900">
                    مشرف (Moderator)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    إدارة المنتجات والمخزون
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    إصدار الفواتير وعروض الأسعار
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    عرض تقارير المبيعات
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    لا يمكنه حذف المستخدمين
                  </li>
                </ul>
              </div>

              {/* User */}
              <div className="border rounded-lg p-4 bg-gray-50/50 border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">
                    مستخدم (User)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-800">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    إنشاء فواتير (بيع فقط)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    عرض المنتجات
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    لا يمكنه التعديل أو الحذف
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    وصول محدود جداً
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Permissions;
