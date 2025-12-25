import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save } from "lucide-react";

const AddProduct = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="w-7 h-7 text-primary" />
            أضف منتجاً
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ المنتج
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>البيانات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المنتج (عربي)</Label>
                    <Input placeholder="مثال: قميص قطني" />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المنتج (إنجليزي)</Label>
                    <Input placeholder="Example: Cotton Shirt" dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الباركود (SKU)</Label>
                    <Input placeholder="Scan or enter barcode" />
                  </div>
                  <div className="space-y-2">
                    <Label>الوحدة</Label>
                    <Input placeholder="قطعة، علبة، كجم..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الأسعار والمخزون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>سعر الشراء</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>سعر البيع</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تنبيه انخفاض المخزون عند كمية</Label>
                  <Input type="number" placeholder="10" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>التصنيف والعلامة التجارية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>القسم</Label>
                  <Input placeholder="اختر القسم" />
                </div>
                <div className="space-y-2">
                  <Label>العلامة التجارية</Label>
                  <Input placeholder="اختر العلامة التجارية" />
                </div>
                <div className="space-y-2">
                  <Label>الضمان</Label>
                  <Input placeholder="اختر الضمان" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الصورة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition cursor-pointer">
                  <p className="text-muted-foreground">اضغط لرفع صورة المنتج</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddProduct;
