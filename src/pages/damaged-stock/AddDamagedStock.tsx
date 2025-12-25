import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddDamagedStock = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-destructive" />
            تسجيل مخزون تالف
          </h1>
          <Button className="gap-2 bg-destructive hover:bg-destructive/90">
            <Save className="w-4 h-4" />
            حفظ
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>المنتج</Label>
                <Input placeholder="بحث عن منتج" />
              </div>
              <div className="space-y-2">
                <Label>الكمية التالفة</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>سبب التلف</Label>
                <Input placeholder="مثال: منتهي الصلاحية، كسر أثناء النقل..." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddDamagedStock;
