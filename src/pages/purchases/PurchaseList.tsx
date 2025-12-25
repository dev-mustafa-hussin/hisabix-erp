import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PurchaseList = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-primary" />
              قائمة المشتريات
            </h1>
            <p className="text-muted-foreground mt-1">
              عرض سجل فواتير المشتريات وإدارتها
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            أضف مشتريات
          </Button>
        </div>

        <div className="flex gap-4 mb-4">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> تصفية
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الفاتورة</TableHead>
                  <TableHead className="text-right">المورد</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">المستحق</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      PO-2023-{1000 + i}
                    </TableCell>
                    <TableCell>مورد تجريبي {i}</TableCell>
                    <TableCell>2023-12-{10 + i}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                        مستلم
                      </span>
                    </TableCell>
                    <TableCell>{i * 5000} ج.م</TableCell>
                    <TableCell>0.00 ج.م</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseList;
