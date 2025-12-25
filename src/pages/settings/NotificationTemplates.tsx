import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

const NotificationTemplates = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" />
            نماذج الإشعارات
          </h1>
          <p className="text-muted-foreground mt-1">
            تخصيص رسائل البريد الإلكتروني و SMS
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>قائمة القوالب (البريد الإلكتروني، SMS، واتساب)</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationTemplates;
