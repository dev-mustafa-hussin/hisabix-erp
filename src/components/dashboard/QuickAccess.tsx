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
  { icon: Receipt, label: "إدارة المشتريات", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
  { icon: RefreshCcw, label: "مرتجع مبيعات", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  { icon: ShoppingCart, label: "مرتجع مبيعات", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  { icon: CreditCard, label: "فاتورة مبيعات", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { icon: FileText, label: "نقطة البيع", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { icon: ClipboardList, label: "التقرير الإحترافى", color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
  { icon: Users, label: "العملاء", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  { icon: Wallet, label: "الموردين", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  { icon: FolderOpen, label: "المسوغات", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" },
  { icon: Settings, label: "الحسابات الساعة", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
];

const QuickAccess = () => {
  return (
    <div className="bg-card rounded-xl p-4 lg:p-6 shadow-sm border border-border transition-colors duration-300 animate-fade-in">
      <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full" />
        الوصول السريع
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 lg:gap-4">
        {quickAccessItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              style={{ animationDelay: `${index * 50}ms` }}
              className="flex flex-col items-center gap-2 p-3 lg:p-4 rounded-xl hover:bg-muted transition-all duration-300 hover:scale-105 hover:shadow-md animate-fade-in-scale opacity-0"
            >
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${item.color} flex items-center justify-center transition-transform duration-300 hover:rotate-6`}>
                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <span className="text-xs text-card-foreground text-center leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccess;
