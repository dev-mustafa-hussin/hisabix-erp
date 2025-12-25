import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddPurchase = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-primary" />
            إضافة مشتريات
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ الفاتورة
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <Input placeholder="اختر المورد" />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الشراء</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="border rounded-lg p-8 text-center text-muted-foreground bg-gray-50 h-64 flex flex-col justify-center items-center">
                <p>قائمة المنتجات</p>
                <Button variant="link">أضف منتج</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold border-b pb-2">ملخص الفاتورة</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>المجموع</span>
                  <span>0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة</span>
                  <span>0.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
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

export default AddPurchase;
