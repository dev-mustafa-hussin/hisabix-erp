import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, Tag, Percent } from "lucide-react";

const CustomerGroups = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              مجموعات العملاء
            </h1>
            <p className="text-muted-foreground mt-1">
              تصنيف العملاء وتحديد خصومات خاصة لكل مجموعة
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة مجموعة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* VIP Group */}
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  نشط
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">عملاء مميزين (VIP)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                العملاء ذوي المشتريات العالية والدفع النقدي.
              </p>

              <div className="flex items-center gap-2 mb-4 p-2 bg-secondary/50 rounded">
                <Percent className="w-4 h-4 text-primary" />
                <span className="font-medium">خصم تلقائي: 10%</span>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <span>15 عميل</span>
                <Button variant="link" size="sm" className="h-auto p-0">
                  تعديل
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wholesale Group */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tag className="w-5 h-5 text-blue-600" />
                </div>
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  نشط
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">تجار الجملة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                الأسعار الخاصة للتجار والكميات الكبيرة.
              </p>

              <div className="flex items-center gap-2 mb-4 p-2 bg-secondary/50 rounded">
                <Percent className="w-4 h-4 text-primary" />
                <span className="font-medium">سعر الجملة</span>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <span>8 عملاء</span>
                <Button variant="link" size="sm" className="h-auto p-0">
                  تعديل
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Retail Group */}
          <Card className="border-l-4 border-l-gray-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Tag className="w-5 h-5 text-gray-600" />
                </div>
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  نشط
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">عملاء التجزئة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                العملاء العاديين (الافتراضي).
              </p>

              <div className="flex items-center gap-2 mb-4 p-2 bg-secondary/50 rounded">
                <Percent className="w-4 h-4 text-primary" />
                <span className="font-medium">سعر القطاعي</span>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <span>142 عميل</span>
                <Button variant="link" size="sm" className="h-auto p-0">
                  تعديل
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerGroups;
