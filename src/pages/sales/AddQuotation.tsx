import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddQuotation = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            إضافة عرض سعر
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ العرض
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>العميل المستهدف</Label>
                <Input placeholder="اسم العميل" />
              </div>
              <div className="border rounded-lg p-8 text-center text-muted-foreground bg-gray-50 h-64 flex flex-col justify-center items-center">
                <p>قائمة المنتجات في العرض</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddQuotation;
