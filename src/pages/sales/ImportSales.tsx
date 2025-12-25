import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Import } from "lucide-react";

const ImportSales = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Import className="w-7 h-7 text-primary" />
            استيراد المبيعات
          </h1>
          <p className="text-muted-foreground mt-1">
            استيراد سجلات مبيعات سابقة من Excel
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>واجهة رفع ملفات Excel</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ImportSales;
