import { Bell, Calendar, Grid3X3, HelpCircle, RefreshCcw, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 fixed top-0 left-0 right-64 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">محمد مجدي</span>
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">حالة الاشتراك</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{currentDate}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <Grid3X3 className="w-4 h-4" />
          <span>نقطة بيع</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <RefreshCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Sun className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
