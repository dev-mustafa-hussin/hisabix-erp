import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ScanBarcode } from "lucide-react";

const BarcodeSettings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanBarcode className="w-7 h-7 text-primary" />
            إعدادات الباركود
          </h1>
          <p className="text-muted-foreground mt-1">
            تخصيص ملصقات الباركود وطباعتها
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>إعدادات تصميم وطباعة الباركود</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BarcodeSettings;
