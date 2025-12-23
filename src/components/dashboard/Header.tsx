import { Calendar, Grid3X3, HelpCircle, LogOut, RefreshCcw, Settings, Sun, Moon, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { toastSuccess, toastInfo } from "@/utils/toastNotifications";
import NotificationsDropdown from "./NotificationsDropdown";
import { MobileSidebarTrigger } from "./Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const currentDate = new Date().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleLogout = async () => {
    await signOut();
    toastSuccess("تم تسجيل الخروج", "نراك قريباً!");
    navigate("/");
  };

  const handleRefresh = () => {
    toastInfo("جاري التحديث", "يتم تحديث البيانات...");
    window.location.reload();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toastInfo(
      theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن",
      theme === "dark" ? "تم التبديل إلى الوضع الفاتح" : "تم التبديل إلى الوضع الداكن"
    );
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 lg:right-64 z-50 transition-colors duration-300">
      <div className="flex items-center gap-2 lg:gap-4">
        <MobileSidebarTrigger />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted/50">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm truncate max-w-32 lg:max-w-none text-muted-foreground">
                {user?.user_metadata?.full_name || user?.email || "مستخدم"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile-settings")} className="gap-2 cursor-pointer">
              <User className="w-4 h-4" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/company-settings")} className="gap-2 cursor-pointer">
              <Settings className="w-4 h-4" />
              إعدادات الشركة
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{currentDate}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 lg:gap-2 hidden md:flex transition-all duration-200 hover:scale-105">
          <Grid3X3 className="w-4 h-4" />
          <span className="hidden lg:inline">نقطة بيع</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex transition-all duration-200 hover:scale-110 hover:rotate-180" onClick={handleRefresh}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleThemeToggle}
          className="text-muted-foreground transition-all duration-300 hover:scale-110"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-90" />
          ) : (
            <Moon className="w-4 h-4 transition-transform duration-300" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex transition-all duration-200 hover:scale-110">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
