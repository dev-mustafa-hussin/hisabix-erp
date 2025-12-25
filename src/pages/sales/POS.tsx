import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, Calculator, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// POS typically takes over the full screen, so we might not use DashboardLayout, or use a simplified version.
// For now using a custom layout simulation.

const POS = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* POS Header */}
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-primary-foreground"
            onClick={() => navigate("/dashboard")}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">نقطة البيع</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
            <User className="w-4 h-4" />
            <span>عميل نقدي</span>
          </div>
          <span className="font-mono text-xl">00:00</span>
        </div>
      </header>

      {/* POS Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Grid (Left) */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-10 py-6 text-lg"
              placeholder="بحث عن منتج (باركود/اسم)..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition flex flex-col items-center text-center gap-2"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-2"></div>
                <h3 className="font-bold">منتج {i}</h3>
                <span className="text-primary font-bold">{i * 10}.00 ج.م</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cart (Right) */}
        <div className="w-96 bg-white border-r flex flex-col shadow-xl">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center text-muted-foreground mt-20">
              <Calculator className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>السلة فارغة</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span>0.00 ج.م</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-12 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              >
                إلغاء
              </Button>
              <Button className="h-12 text-lg">دفع</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
