import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

const PurchaseReturns = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-primary" />
            قائمة مرتجع المشتريات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة البضائع المرجعة للموردين
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>لا يوجد مرتجعات حالياً</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseReturns;
