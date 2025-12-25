import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { PackageOpen } from "lucide-react";

const ImportOpeningStock = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackageOpen className="w-7 h-7 text-primary" />
            استيراد المخزون الافتتاحي
          </h1>
          <p className="text-muted-foreground mt-1">
            إدخال أرصدة أول المدة للمنتجات الموجودة مسبقاً
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>قريباً: واجهة استيراد أرصدة المخزون</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ImportOpeningStock;
