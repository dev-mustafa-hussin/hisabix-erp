import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Import, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const ImportProducts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Import className="w-7 h-7 text-primary" />
              استيراد المنتجات
            </h1>
            <p className="text-muted-foreground mt-1">
              إضافة منتجات متعددة عبر ملف Excel أو CSV
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold">1. تحميل القالب</h3>
              <p className="text-sm text-muted-foreground">
                حمل ملف القالب لملء بيانات المنتجات بالشكل الصحيح.
              </p>
              <Button variant="outline" className="w-full">
                تحميل ملف Excel
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold">2. رفع الملف</h3>
              <p className="text-sm text-muted-foreground">
                ارفع الملف بعد تعبئته بالبيانات.
              </p>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p>اضغط لرفع الملف</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImportProducts;
