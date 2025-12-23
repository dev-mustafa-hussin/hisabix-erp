import { 
  FileText, 
  RefreshCcw, 
  ShoppingCart, 
  CreditCard, 
  ClipboardList, 
  Users, 
  Wallet,
  Receipt,
  FolderOpen,
  Settings
} from "lucide-react";

const quickAccessItems = [
  { icon: Receipt, label: "إدارة المشتريات", color: "bg-pink-100 text-pink-600" },
  { icon: RefreshCcw, label: "مرتجع مبيعات", color: "bg-orange-100 text-orange-600" },
  { icon: ShoppingCart, label: "مرتجع مبيعات", color: "bg-purple-100 text-purple-600" },
  { icon: CreditCard, label: "فاتورة مبيعات", color: "bg-blue-100 text-blue-600" },
  { icon: FileText, label: "نقطة البيع", color: "bg-yellow-100 text-yellow-600" },
  { icon: ClipboardList, label: "التقرير الإحترافى", color: "bg-teal-100 text-teal-600" },
  { icon: Users, label: "العملاء", color: "bg-red-100 text-red-600" },
  { icon: Wallet, label: "الموردين", color: "bg-green-100 text-green-600" },
  { icon: FolderOpen, label: "المسوغات", color: "bg-gray-100 text-gray-600" },
  { icon: Settings, label: "الحسابات الساعة", color: "bg-indigo-100 text-indigo-600" },
];

const QuickAccess = () => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full" />
        الوصول السريع
      </h3>
      <div className="grid grid-cols-5 gap-4">
        {quickAccessItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-card-foreground text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccess;
