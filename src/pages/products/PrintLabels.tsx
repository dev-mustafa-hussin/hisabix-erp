import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Printer } from "lucide-react";

const PrintLabels = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Printer className="w-7 h-7 text-primary" />
              طباعة الملصقات
            </h1>
            <p className="text-muted-foreground mt-1">
              طباعة الباركود وملصقات الأسعار للمنتجات
            </p>
          </div>
        </div>

        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <Printer className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>قريباً: واجهة اختيار المنتجات وطباعة الباركود</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PrintLabels;
