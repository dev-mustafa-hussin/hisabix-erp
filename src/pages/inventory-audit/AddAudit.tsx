import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddAudit = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            بدء عملية جرد جديدة
          </h1>
          <Button className="gap-2">
            <Play className="w-4 h-4" />
            بدء الجرد
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>اسم عملية الجرد</Label>
                <Input placeholder="مثال: جرد نهاية العام 2023" />
              </div>
              <div className="space-y-2">
                <Label>الفرع / المخزن</Label>
                <Input placeholder="اختر المخزن" />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الجرد</Label>
                <Input type="date" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddAudit;
