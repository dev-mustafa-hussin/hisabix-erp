import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";

const Variations = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SlidersHorizontal className="w-7 h-7 text-primary" />
            التباينات (Variations)
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة خصائص المنتجات المتغيرة مثل الألوان والمقاسات
          </p>
        </div>
        <Card className="h-96 flex items-center justify-center border-dashed">
          <CardContent className="text-center text-muted-foreground">
            <p>قريباً: إدارة الألوان، المقاسات، والخصائص الأخرى</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Variations;
