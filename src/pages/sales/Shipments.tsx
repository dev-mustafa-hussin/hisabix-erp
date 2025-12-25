import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

const Shipments = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary" />
            الشحنات
          </h1>
          <p className="text-muted-foreground mt-1">
            تتبع شحنات المبيعات وحالتها
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>لا يوجد شحنات نشطة</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Shipments;
