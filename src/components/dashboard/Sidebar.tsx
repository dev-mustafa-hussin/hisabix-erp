import { useState } from "react";
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
  ChevronLeft,
  Store,
  Receipt,
  Truck,
  UserPlus,
  FileBox,
  Calculator,
  Bell,
  History,
  PieChart,
  BarChart2,
  ClipboardList,
  Menu,
  X,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSidebar } from "@/contexts/SidebarContext";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  hasSubmenu?: boolean;
  submenu?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "الرئيسية", href: "/dashboard" },
  { icon: UserPlus, label: "إدارة المستخدمين", href: "/user-management" },
  { icon: ClipboardList, label: "سجل التدقيق", href: "/audit-logs" },
  { icon: Users, label: "العملاء", href: "/customers" },
  { icon: Package, label: "المنتجات", href: "/products" },
  { icon: Warehouse, label: "إدارة المخزون", href: "/inventory" },
  { icon: PieChart, label: "تقرير المخزون", href: "/inventory-report" },
  { icon: CreditCard, label: "المستحقات", href: "/receivables" },
  { icon: FileText, label: "الفواتير", href: "/invoices" },
  {
    icon: ShoppingCart,
    label: "المشتريات",
    href: "#",
    hasSubmenu: true,
    submenu: [
      { label: "فاتورة مشتريات", href: "#" },
      { label: "مرتجع مشتريات", href: "#" },
    ],
  },
  { icon: Store, label: "المبيعات", href: "/sales" },
  { icon: Receipt, label: "المصروفات", href: "#" },
  {
    icon: Truck,
    label: "إدارة المشتريات",
    href: "#",
    hasSubmenu: true,
    submenu: [
      { label: "طلبات الشراء", href: "#" },
      { label: "الموردين", href: "#" },
    ],
  },
  { icon: Calculator, label: "التقارير", href: "/reports" },
  { icon: FileBox, label: "نماذج الإشعارات", href: "#" },
  { icon: BarChart3, label: "إدارة الترويج المخزني", href: "#" },
  {
    icon: Store,
    label: "المتجر الإلكتروني",
    href: "#",
    hasSubmenu: true,
    submenu: [
      { label: "إعدادات المتجر", href: "/online-store-settings" },
      { label: "عرض المتجر", href: "#" },
    ],
  },
  { icon: Settings, label: "إعدادات الشركة", href: "/company-settings" },
  { icon: Bell, label: "إعدادات الإشعارات", href: "/notification-settings" },
  {
    icon: BarChart2,
    label: "لوحة تحكم الإشعارات",
    href: "/notifications-dashboard",
  },
  { icon: History, label: "سجل الإشعارات", href: "/notification-logs" },
];

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform duration-300 hover:rotate-12">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-sidebar-foreground">EDOXO</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden transition-transform duration-200 hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Menu */}
      <nav className="p-2 flex-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          const isExpanded = expandedMenus.includes(item.label);

          return (
            <div
              key={index}
              style={{ animationDelay: `${index * 30}ms` }}
              className="animate-fade-in opacity-0"
            >
              {item.hasSubmenu ? (
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-lg mb-1 transition-all duration-200 text-sm group hover:translate-x-1",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
              ) : (
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 rounded-lg mb-1 transition-all duration-200 text-sm group hover:translate-x-1",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                        isActive && "animate-bounce-in"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )}

              {/* Submenu with animation */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  item.hasSubmenu && isExpanded
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                )}
              >
                {item.hasSubmenu && item.submenu && (
                  <div className="mr-6 border-r border-sidebar-border pr-2 mb-2">
                    {item.submenu.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subItem.href}
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-all duration-200 hover:translate-x-1"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

// Mobile Sidebar Trigger
export const MobileSidebarTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden transition-transform duration-200 hover:scale-110"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-72 bg-sidebar">
        <SidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

const Sidebar = () => {
  return (
    <aside className="w-64 bg-sidebar h-screen fixed right-0 top-0 border-l border-sidebar-border overflow-y-auto hidden lg:block transition-colors duration-300">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;
