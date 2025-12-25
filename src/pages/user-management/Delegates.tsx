import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Phone, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Delegates = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="w-7 h-7 text-primary" />
              إدارة المندوبين
            </h1>
            <p className="text-muted-foreground mt-1">
              متابعة مناديب التوصيل ومناطق التوزيع
            </p>
          </div>
          <Button>إضافة مندوب جديد</Button>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input placeholder="بحث عن مندوب..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder items */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">أحمد محمد {i}</h3>
                      <p className="text-sm text-muted-foreground">
                        مندوب توصيل
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    نشط
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>منطقة القاهرة الجديدة</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>010XXXXXXX{i}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>15 طلبية اليوم</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    التفاصيل
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full">
                    تعديل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Delegates;
