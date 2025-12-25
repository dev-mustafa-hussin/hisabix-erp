import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const TrendingProducts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary" />
            المنتجات الشائعة
          </h1>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>تحليل اتجاهات المنتجات</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TrendingProducts;
