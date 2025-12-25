import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const InvoiceSettings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            إعدادات الفواتير
          </h1>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            حفظ الإعدادات
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>تنسيق الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>بادئة رقم الفاتورة (Prefix)</Label>
                <Input placeholder="INV-" />
              </div>
              <div className="flex items-center justify-between">
                <Label>إظهار الشعار في الفاتورة</Label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <Label>إظهار QR Code (فاتورة إلكترونية)</Label>
                <Switch checked={true} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>شروط وأحكام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نص تذييل الفاتورة</Label>
                <Input placeholder="شكراً لتعاملكم معنا" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceSettings;
