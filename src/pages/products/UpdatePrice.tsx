import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const UpdatePrice = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-primary" />
            تحديث الأسعار
          </h1>
          <p className="text-muted-foreground mt-1">
            تحديث أسعار مجموعة من المنتجات دفعة واحدة
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>قريباً: أدوات التحديث الجماعي للأسعار</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UpdatePrice;
