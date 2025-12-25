import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const ProfitLoss = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            تقرير الربح / الخسارة
          </h1>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>رسم بياني وجدول يوضح الأرباح والخسائر للفترة المحددة</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfitLoss;
