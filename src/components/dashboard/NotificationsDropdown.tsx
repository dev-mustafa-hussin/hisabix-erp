import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertTriangle, Clock, FileText } from "lucide-react";
import { format, isPast, isToday, addDays } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  type: "overdue" | "due_soon" | "unpaid";
  title: string;
  message: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string | null;
  priority: "high" | "medium" | "low";
}

const NotificationsDropdown = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchNotifications();
      // Check every minute for updates
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [companyId]);

  const fetchCompanyId = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setCompanyId(data.company_id);
    }
  };

  const fetchNotifications = async () => {
    if (!companyId) return;

    // Get invoices that are not paid or cancelled
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("company_id", companyId)
      .not("status", "in", '("paid","cancelled")')
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching invoices for notifications:", error);
      return;
    }

    const notificationsList: Notification[] = [];
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    for (const invoice of invoices || []) {
      const remaining = invoice.total - invoice.paid_amount;
      
      if (remaining <= 0) continue;

      if (invoice.due_date) {
        const dueDate = new Date(invoice.due_date);

        // Overdue invoices
        if (isPast(dueDate) && !isToday(dueDate)) {
          notificationsList.push({
            id: `overdue-${invoice.id}`,
            type: "overdue",
            title: "فاتورة متأخرة",
            message: `الفاتورة ${invoice.invoice_number} متأخرة عن موعد السداد`,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: remaining,
            dueDate: invoice.due_date,
            priority: "high",
          });

          // Update invoice status to overdue if not already
          if (invoice.status !== "overdue") {
            await supabase
              .from("invoices")
              .update({ status: "overdue" })
              .eq("id", invoice.id);
          }
        }
        // Due soon (within 3 days)
        else if (dueDate <= threeDaysFromNow) {
          notificationsList.push({
            id: `due-soon-${invoice.id}`,
            type: "due_soon",
            title: "فاتورة مستحقة قريباً",
            message: `الفاتورة ${invoice.invoice_number} مستحقة ${isToday(dueDate) ? "اليوم" : `خلال ${Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} أيام`}`,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: remaining,
            dueDate: invoice.due_date,
            priority: "medium",
          });
        }
      } else if (remaining > 0) {
        // Unpaid invoices without due date
        notificationsList.push({
          id: `unpaid-${invoice.id}`,
          type: "unpaid",
          title: "فاتورة غير مدفوعة",
          message: `الفاتورة ${invoice.invoice_number} بها مستحقات غير مدفوعة`,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          amount: remaining,
          dueDate: null,
          priority: "low",
        });
      }
    }

    // Sort by priority
    notificationsList.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setNotifications(notificationsList);
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    navigate("/invoices");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "due_soon":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-r-destructive bg-destructive/5";
      case "medium":
        return "border-r-yellow-500 bg-yellow-500/5";
      default:
        return "border-r-muted-foreground bg-muted/50";
    }
  };

  const overdueCount = notifications.filter((n) => n.type === "overdue").length;
  const totalCount = notifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {totalCount > 0 && (
            <Badge
              variant={overdueCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">الإشعارات</h3>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} متأخرة
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-right p-4 hover:bg-muted/50 transition-colors border-r-4 ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium text-primary">
                          {notification.amount.toFixed(2)} جنيه
                        </span>
                        {notification.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.dueDate), "dd/MM/yyyy", { locale: ar })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setIsOpen(false);
                navigate("/invoices");
              }}
            >
              عرض كل الفواتير
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
