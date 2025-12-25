import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddExpense = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" />
            إضافة مصروف
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>فئة المصروف</Label>
                <Input placeholder="اختر الفئة" />
              </div>
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Input />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddExpense;
