import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileEdit, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddDraft = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileEdit className="w-7 h-7 text-primary" />
            إضافة مسودة
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ المسودة
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>اسم المسودة</Label>
                <Input placeholder="مثال: طلب قيد الانتظار" />
              </div>
              <div className="border rounded-lg p-8 text-center text-muted-foreground bg-gray-50 h-64 flex flex-col justify-center items-center">
                <p>قائمة المنتجات</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddDraft;
