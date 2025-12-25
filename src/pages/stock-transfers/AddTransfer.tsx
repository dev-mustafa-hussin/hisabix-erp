import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddTransfer = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRight className="w-7 h-7 text-primary" />
            إضافة تحويل مخزون
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ العملية
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>من فرع/مخزن</Label>
                  <Input placeholder="المصدر" />
                </div>
                <div className="space-y-2">
                  <Label>إلى فرع/مخزن</Label>
                  <Input placeholder="الوجهة" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddTransfer;
