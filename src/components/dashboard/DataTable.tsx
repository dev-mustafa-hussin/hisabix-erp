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
    <div className="bg-card rounded-xl p-4 lg:p-6 shadow-sm border border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">تصدير إلى CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <FileSpreadsheet className="w-3 h-3" />
            <span className="hidden sm:inline">تصدير إلى Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <FileText className="w-3 h-3" />
            طباعة
          </Button>
        </div>
        <h3 className="text-base lg:text-lg font-semibold text-card-foreground flex items-center gap-2 order-first sm:order-last">
          {icon}
          {title}
        </h3>
      </div>

      {filterTabs && (
        <div className="flex items-center gap-2 mb-4 justify-end overflow-x-auto pb-2">
          {filterTabs.map((tab, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
              className="text-xs whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="py-2 lg:py-3 px-2 lg:px-4 text-right text-xs lg:text-sm font-medium text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="py-6 lg:py-8 text-center text-muted-foreground text-sm">
                لا توجد بيانات متاحة في الجدول
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 text-xs lg:text-sm text-muted-foreground gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="text-xs">
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <Button variant="outline" size="sm" disabled className="text-xs">
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
