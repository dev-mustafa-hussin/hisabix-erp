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
  {
    icon: UserPlus,
    label: "إدارة المستخدمين",
    href: "#",
    hasSubmenu: true,
    submenu: [
      { label: "المستخدمين", href: "/user-management/users" },
      { label: "الصلاحيات", href: "/user-management/permissions" },
      { label: "المندوبين", href: "/user-management/delegates" },
    ],
  },
  { icon: ClipboardList, label: "سجل التدقيق", href: "/audit-logs" },
  {
    icon: Users,
    label: "جهات الاتصال",
    href: "#",
    hasSubmenu: true,
    submenu: [
      { label: "الموردين", href: "/contacts/suppliers" },
      { label: "العملاء", href: "/contacts/customers" },
      { label: "مجموعات العملاء", href: "/contacts/groups" },
      { label: "استيراد جهات الاتصال", href: "/contacts/import" },
      { label: "خريطة", href: "/contacts/map" },
    ],
  },
  {
    icon: Package,
    label: "المنتجات",
    href: "#",
    hasSubmenu: true,
    submenu: [
      { label: "قائمة المنتجات", href: "/products" },
      { label: "أضف منتج", href: "/products/add" },
      { label: "تحديث الأسعار", href: "/products/update-price" },
      { label: "طباعة الملصقات", href: "/products/labels" },
      { label: "التباينات", href: "/products/variations" },
      { label: "استيراد المنتجات", href: "/products/import" },
      { label: "استيراد المخزون الافتتاحي", href: "/products/opening-stock" },
      { label: "مجموعة أسعار البيع", href: "/products/selling-price-groups" },
      { label: "الوحدات", href: "/products/units" },
      { label: "الأقسام", href: "/products/categories" },
      { label: "العلامات التجارية", href: "/products/brands" },
      { label: "الضمانات", href: "/products/warranties" },
    ],
  },
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
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (label: string) => {
    if (isCollapsed) return; // Don't expand in collapsed mode
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div
        className={cn(
          "p-4 border-b border-sidebar-border flex items-center justify-between transition-all duration-300",
          isCollapsed ? "px-2 justify-center" : "px-4"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 hover:rotate-12">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-sidebar-foreground animate-in fade-in slide-in-from-right-2">
              EDOXO
            </span>
          )}
        </div>
        {!onClose && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex transition-colors duration-200 hover:bg-sidebar-accent/50 group"
          >
            <MoreVertical className="w-5 h-5 text-sidebar-foreground/50 group-hover:text-sidebar-primary" />
          </Button>
        )}
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
      <nav className="p-2 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
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
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center justify-between py-2.5 rounded-lg mb-1 transition-all duration-200 text-sm group hover:translate-x-1",
                    isCollapsed ? "px-3 justify-center" : "px-4",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    {!isCollapsed && (
                      <span className="animate-in fade-in slide-in-from-right-2">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        isExpanded && "rotate-180"
                      )}
                    />
                  )}
                </button>
              ) : (
                <Link
                  to={item.href}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center justify-between py-2.5 rounded-lg mb-1 transition-all duration-200 text-sm group hover:translate-x-1",
                    isCollapsed ? "px-3 justify-center" : "px-4",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive && "animate-bounce-in"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="animate-in fade-in slide-in-from-right-2">
                        {item.label}
                      </span>
                    )}
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
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        "bg-sidebar h-screen fixed right-0 top-0 border-l border-sidebar-border overflow-y-auto hidden lg:block transition-all duration-300 z-40",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent />
      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute top-4 left-4 transition-all duration-200 hover:scale-110"
        >
          <Menu className="w-5 h-5 text-sidebar-foreground/50" />
        </Button>
      )}
    </aside>
  );
};

export default Sidebar;
