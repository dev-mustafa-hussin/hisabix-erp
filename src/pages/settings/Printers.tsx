import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Printer } from "lucide-react";

const Printers = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Printer className="w-7 h-7 text-primary" />
            طابعات الايصالات
          </h1>
          <p className="text-muted-foreground mt-1">
            إعداد وتوصيل طابعات الكاشير
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>قائمة الطابعات المتصلة وإعداداتها</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Printers;
