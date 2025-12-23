import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, CreditCard, AlertTriangle } from "lucide-react";

const stats = [
  {
    label: "إجمالى المبيعات",
    value: "L.E 0.00",
    icon: TrendingUp,
    color: "bg-blue-500",
    trend: "up",
  },
  {
    label: "إجمالى الدولة",
    value: "L.E 0.00",
    icon: DollarSign,
    color: "bg-teal-500",
    trend: "up",
  },
  {
    label: "المواقع الغير مدفوعة",
    value: "L.E 0.00",
    icon: AlertTriangle,
    color: "bg-yellow-500",
    trend: "down",
  },
  {
    label: "إجمالى مرتجع المبيعات",
    value: "L.E 0.00",
    icon: TrendingDown,
    color: "bg-orange-500",
    trend: "down",
  },
  {
    label: "إرسال / المشتريات",
    value: "L.E 0.00",
    icon: ShoppingBag,
    color: "bg-purple-500",
    trend: "up",
  },
  {
    label: "المشتروات الغير مدفوعة",
    value: "L.E 0.00",
    icon: CreditCard,
    color: "bg-red-500",
    trend: "down",
  },
  {
    label: "إر سال/ دخول المشتروات",
    value: "L.E 0.00",
    icon: TrendingDown,
    color: "bg-pink-500",
    trend: "down",
  },
  {
    label: "مسحوبات",
    value: "L.E 0.00",
    icon: TrendingDown,
    color: "bg-red-400",
    trend: "down",
  },
];

const StatsCards = () => {
  return (
    <div className="bg-card rounded-xl p-4 lg:p-6 shadow-sm border border-border transition-colors duration-300 animate-fade-in" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs lg:text-sm text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
          <span className="hidden sm:inline">تنبيه: قم بأخذ نسخة احتياطية من البيانات بشكل دوري</span>
          <span className="sm:hidden">تنبيه مهم</span>
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              style={{ animationDelay: `${150 + index * 50}ms` }}
              className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4 bg-muted/30 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:bg-muted/50 animate-fade-in-scale opacity-0 cursor-pointer"
            >
              <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12`}>
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-sm lg:text-lg font-semibold text-card-foreground">{stat.value}</p>
              </div>
              {stat.trend === "up" ? (
                <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-success flex-shrink-0 animate-bounce" style={{ animationDuration: "2s" }} />
              ) : (
                <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4 text-destructive flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsCards;
