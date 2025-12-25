import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart } from "lucide-react";

const SalesReport = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart className="w-7 h-7 text-primary" />
            تقرير المبيعات
          </h1>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>تفاصيل المبيعات حسب الفترة، الموظف، أو الفرع</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SalesReport;
