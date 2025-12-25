import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tags, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ExpenseCategories = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="w-7 h-7 text-primary" />
            فئات المصاريف
          </h1>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة فئة
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الفئة</TableHead>
                  <TableHead className="text-right">رمز الفئة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">إيجار</TableCell>
                  <TableCell>EXP-RENT</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      تعديل
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">كهرباء</TableCell>
                  <TableCell>EXP-ELEC</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      تعديل
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">رواتب</TableCell>
                  <TableCell>EXP-SALARY</TableCell>
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

export default ExpenseCategories;
