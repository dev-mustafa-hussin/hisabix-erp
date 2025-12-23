import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, ChevronRight, ChevronLeft } from "lucide-react";

interface DataTableProps {
  title: string;
  icon: React.ReactNode;
  columns: string[];
  filterTabs?: string[];
}

const DataTable = ({ title, icon, columns, filterTabs }: DataTableProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Download className="w-3 h-3" />
            تصدير إلى CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <FileSpreadsheet className="w-3 h-3" />
            تصدير إلى Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <FileText className="w-3 h-3" />
            طباعة
          </Button>
        </div>
        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>

      {filterTabs && (
        <div className="flex items-center gap-2 mb-4 justify-end">
          {filterTabs.map((tab, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
              className="text-xs"
            >
              {tab}
            </Button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="py-3 px-4 text-right text-sm font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                لا توجد بيانات متاحة في الجدول
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <Button variant="outline" size="sm" disabled>
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <span>عرض 0 إلى 0 من 0 إدخالات</span>
      </div>
    </div>
  );
};

export default DataTable;
