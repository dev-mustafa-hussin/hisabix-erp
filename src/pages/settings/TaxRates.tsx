import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Percent, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TaxRates = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Percent className="w-7 h-7 text-primary" />
              معدلات الضرائب
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة أنواع ونسّب الضرائب مثل ضريبة القيمة المضافة
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة ضريبة
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الضريبة</TableHead>
                  <TableHead className="text-right">النسبة %</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    ضريبة القيمة المضافة (VAT)
                  </TableCell>
                  <TableCell>15%</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      تعديل
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ضريبة صفرية</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      تعديل
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TaxRates;
