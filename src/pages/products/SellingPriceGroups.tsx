import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tags } from "lucide-react";

const SellingPriceGroups = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="w-7 h-7 text-primary" />
            مجموعات أسعار البيع
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة قوائم أسعار متعددة (جملة، تجزئة، VIP...)
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>قريباً: إدارة قوائم الأسعار المتعددة</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SellingPriceGroups;
