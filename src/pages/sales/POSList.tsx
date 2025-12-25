import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor } from "lucide-react";

const POSList = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-7 h-7 text-primary" />
            قائمة نقطة البيع (POS)
          </h1>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>سجل جلسات نقاط البيع المفتوحة والمغلقة</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default POSList;
