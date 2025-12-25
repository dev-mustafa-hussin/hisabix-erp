import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Percent } from "lucide-react";

const Discounts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Percent className="w-7 h-7 text-primary" />
            الخصومات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة الخصومات والعروض الترويجية
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>قائمة الخصومات المتاحة</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Discounts;
