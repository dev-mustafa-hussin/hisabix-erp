import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddSale = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-7 h-7 text-primary" />
            إضافة بيع
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ العملية
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العميل</Label>
                  <Input placeholder="عميل نقدي" />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="border rounded-lg p-8 text-center text-muted-foreground bg-gray-50 h-64 flex flex-col justify-center items-center">
                <p>البحث عن منتج...</p>
                <Input
                  className="max-w-xs mt-2"
                  placeholder="Scan barcode or type name"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold border-b pb-2">الدفع</h3>
              <div className="space-y-2">
                <Label>المبلغ المستلم</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span>0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddSale;
