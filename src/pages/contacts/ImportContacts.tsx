import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react";

const ImportContacts = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="w-7 h-7 text-primary" />
            استيراد جهات الاتصال
          </h1>
          <p className="text-muted-foreground mt-1">
            إضافة عدد كبير من العملاء أو الموردين دفعة واحدة عبر ملف Excel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Download Template */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-bold">تحميل القالب</h3>
              <p className="text-sm text-muted-foreground">
                قم بتحميل ملف Excel النموذجي لتعبئة بيانات العملاء بالشكل
                الصحيح.
              </p>
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                تحميل القالب (Excel)
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Upload File */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-bold">رفع الملف</h3>
              <p className="text-sm text-muted-foreground">
                اختر الملف الذي قمت بتعبئته لرفعه إلى النظام.
              </p>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">اضغط لاختيار ملف</p>
                <p className="text-xs text-muted-foreground mt-1">
                  XLSX, CSV up to 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="space-y-2 text-sm text-amber-800">
            <p className="font-bold">ملاحظات هامة:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>تأكد من عدم وجود أرقام هواتف مكررة.</li>
              <li>الحقول التي تحمل علامة (*) في القالب إلزامية.</li>
              <li>سيتم تجاهل الصفوف الفارغة تلقائياً.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImportContacts;
