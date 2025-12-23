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
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          تنبيه: قم بأخذ نسخة احتياطية من البيانات بشكل دوري
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold text-card-foreground">{stat.value}</p>
              </div>
              {stat.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-success mr-auto" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive mr-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsCards;
