import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Subscription = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-7 h-7 text-primary" />
            اشتراك
          </h1>
          <p className="text-muted-foreground mt-1">
            تفاصل خطة الاشتراك الحالية والتجديد
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                الخطة الاحترافية
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  نشط
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold">
                99${" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / شهرياً
                </span>
              </p>
              <ul className="space-y-2 text-sm">
                <li>✅ عدد لا نهائي من المستخدمين</li>
                <li>✅ عدد لا نهائي من المنتجات</li>
                <li>✅ دعم فني 24/7</li>
              </ul>
              <Button className="w-full">ترقية الخطة</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
