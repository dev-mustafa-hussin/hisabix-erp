import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  CreditCard,
  FileText,
  ShoppingCart,
  Package,
  Warehouse,
  Settings,
  BarChart3,
  ChevronDown,
  LogOut,
  Store,
  Receipt,
  Truck,
  UserPlus,
  FileBox,
  Calculator,
  Megaphone,
} from "lucide-react";
import Logo from "../Logo";

const menuItems = [
  { icon: Home, label: "الرئيسية", href: "/dashboard" },
  { icon: UserPlus, label: "إدارة المستخدمين", href: "#" },
  { icon: Users, label: "العملاء", href: "/customers" },
  { icon: Package, label: "المنتجات", href: "/products" },
  { icon: CreditCard, label: "دورة الأموال", href: "#" },
  { icon: FileText, label: "الفواتير", href: "/invoices" },
  { icon: ShoppingCart, label: "المشتريات", href: "#", hasSubmenu: true },
  { icon: Warehouse, label: "دخول المخزن", href: "#" },
  { icon: Store, label: "المبيعات", href: "/sales" },
  { icon: Receipt, label: "المصروفات", href: "#" },
  { icon: Truck, label: "إدارة المشتريات", href: "#", hasSubmenu: true },
  { icon: Calculator, label: "التقارير", href: "#", hasSubmenu: true },
  { icon: FileBox, label: "نماذج الإشعارات", href: "#" },
  { icon: Megaphone, label: "إدارة الترويج المخزني", href: "#" },
  { icon: BarChart3, label: "المتجر الإلكتروني", href: "#", hasSubmenu: true },
  { icon: Settings, label: "إعدادات الشركة", href: "/company-settings" },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar h-screen fixed right-0 top-0 border-l border-sidebar-border overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-sidebar-foreground">EDOXO</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="p-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={index}
              to={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.hasSubmenu && <ChevronDown className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
