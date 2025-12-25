import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

const ExpenseReport = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" />
            تقرير المصاريف
          </h1>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>تحليل المصاريف حسب الفئة</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExpenseReport;
