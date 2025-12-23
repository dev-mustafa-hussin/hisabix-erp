import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  ArrowLeft,
  CreditCard,
  Download,
  Mail,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { exportReceivablesReport } from "@/utils/pdfExport";
import { toast } from "sonner";

interface CustomerDebt {
  customerId: string;
  customerName: string;
  totalDebt: number;
  invoicesCount: number;
  oldestDueDate: string | null;
  overdueAmount: number;
}

interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  color: string;
}

interface UnpaidInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  paid_amount: number;
  remaining: number;
  due_date: string | null;
  days_overdue: number;
  status: string;
}

const Receivables = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Summary stats
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [totalCustomersWithDebt, setTotalCustomersWithDebt] = useState(0);
  const [collectionRate, setCollectionRate] = useState(0);

  // Data
  const [customerDebts, setCustomerDebts] = useState<CustomerDebt[]>([]);
  const [agingBuckets, setAgingBuckets] = useState<AgingBucket[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);

  useEffect(() => {
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchData();
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

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);

    // Fetch all unpaid invoices
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        *,
        customer:customers(id, name)
      `)
      .eq("company_id", companyId)
      .not("status", "in", '("paid","cancelled")')
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching invoices:", error);
      setLoading(false);
      return;
    }

    const today = new Date();
    let totalRec = 0;
    let totalOver = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    const customerMap: { [key: string]: CustomerDebt } = {};
    const aging = {
      current: { amount: 0, count: 0 },
      "1-30": { amount: 0, count: 0 },
      "31-60": { amount: 0, count: 0 },
      "61-90": { amount: 0, count: 0 },
      "90+": { amount: 0, count: 0 },
    };

    const unpaidList: UnpaidInvoice[] = [];

    for (const invoice of invoices || []) {
      const remaining = invoice.total - invoice.paid_amount;
      if (remaining <= 0) continue;

      totalRec += remaining;
      totalInvoiced += invoice.total;
      totalPaid += invoice.paid_amount;

      const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
      const daysOverdue = dueDate ? differenceInDays(today, dueDate) : 0;

      if (daysOverdue > 0) {
        totalOver += remaining;
      }

      // Aging buckets
      if (!dueDate || daysOverdue <= 0) {
        aging.current.amount += remaining;
        aging.current.count++;
      } else if (daysOverdue <= 30) {
        aging["1-30"].amount += remaining;
        aging["1-30"].count++;
      } else if (daysOverdue <= 60) {
        aging["31-60"].amount += remaining;
        aging["31-60"].count++;
      } else if (daysOverdue <= 90) {
        aging["61-90"].amount += remaining;
        aging["61-90"].count++;
      } else {
        aging["90+"].amount += remaining;
        aging["90+"].count++;
      }

      // Customer aggregation
      const customerId = invoice.customer?.id || "unknown";
      const customerName = invoice.customer?.name || "عميل نقدي";

      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          customerId,
          customerName,
          totalDebt: 0,
          invoicesCount: 0,
          oldestDueDate: invoice.due_date,
          overdueAmount: 0,
        };
      }

      customerMap[customerId].totalDebt += remaining;
      customerMap[customerId].invoicesCount++;
      if (daysOverdue > 0) {
        customerMap[customerId].overdueAmount += remaining;
      }

      // Unpaid invoices list
      unpaidList.push({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_name: customerName,
        total: invoice.total,
        paid_amount: invoice.paid_amount,
        remaining,
        due_date: invoice.due_date,
        days_overdue: Math.max(0, daysOverdue),
        status: invoice.status,
      });
    }

    // Set stats
    setTotalReceivables(totalRec);
    setTotalOverdue(totalOver);
    setTotalCustomersWithDebt(Object.keys(customerMap).length);
    setCollectionRate(totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0);

    // Set customer debts sorted by total debt
    setCustomerDebts(
      Object.values(customerMap).sort((a, b) => b.totalDebt - a.totalDebt)
    );

    // Set aging buckets
    setAgingBuckets([
      { label: "غير مستحقة", amount: aging.current.amount, count: aging.current.count, color: "bg-green-500" },
      { label: "1-30 يوم", amount: aging["1-30"].amount, count: aging["1-30"].count, color: "bg-yellow-500" },
      { label: "31-60 يوم", amount: aging["31-60"].amount, count: aging["31-60"].count, color: "bg-orange-500" },
      { label: "61-90 يوم", amount: aging["61-90"].amount, count: aging["61-90"].count, color: "bg-red-400" },
      { label: "أكثر من 90 يوم", amount: aging["90+"].amount, count: aging["90+"].count, color: "bg-red-600" },
    ]);

    // Set unpaid invoices sorted by days overdue
    setUnpaidInvoices(unpaidList.sort((a, b) => b.days_overdue - a.days_overdue));

    setLoading(false);
  };

  const handleExportPDF = async () => {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();

    exportReceivablesReport({
      company_name: company?.name || "EDOXO",
      total_receivables: totalReceivables,
      total_overdue: totalOverdue,
      customers: customerDebts.map((c) => ({
        name: c.customerName,
        debt: c.totalDebt,
        overdue: c.overdueAmount,
      })),
    });

    toast.success("تم تصدير التقرير إلى PDF");
  };

  const handleSendAllReminders = async () => {
    if (!companyId) return;

    const overdueCount = unpaidInvoices.filter((i) => i.days_overdue > 0).length;
    if (overdueCount === 0) {
      toast.error("لا توجد فواتير متأخرة");
      return;
    }

    toast.loading("جاري إرسال التذكيرات...");

    try {
      const { data, error } = await supabase.functions.invoke("send-invoice-reminder", {
        body: { companyId, sendAll: true },
      });

      if (error) throw error;

      toast.dismiss();
      if (data.sent > 0) {
        toast.success(`تم إرسال ${data.sent} تذكير بنجاح`);
      }
      if (data.failed > 0) {
        toast.warning(`فشل إرسال ${data.failed} تذكير`);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("حدث خطأ في إرسال التذكيرات");
      console.error(error);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    suffix = "",
    variant = "default",
  }: {
    title: string;
    value: number;
    icon: any;
    suffix?: string;
    variant?: "default" | "danger" | "success";
  }) => {
    const colors = {
      default: "text-primary",
      danger: "text-destructive",
      success: "text-green-600",
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className={`text-2xl font-bold mt-1 ${colors[variant]}`}>
                {value.toLocaleString()}
                {suffix}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${colors[variant]}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getStatusBadge = (status: string, daysOverdue: number) => {
    if (daysOverdue > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          متأخرة {daysOverdue} يوم
        </Badge>
      );
    }
    switch (status) {
      case "sent":
        return <Badge variant="outline">مرسلة</Badge>;
      case "draft":
        return <Badge variant="secondary">مسودة</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">المستحقات والديون</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSendAllReminders}
                disabled={unpaidInvoices.filter(i => i.days_overdue > 0).length === 0}
              >
                <Mail className="w-4 h-4 ml-2" />
                إرسال تذكيرات للمتأخرين
              </Button>
              <Button variant="outline" onClick={() => navigate("/invoices")}>
                <ArrowLeft className="w-4 h-4 ml-2" />
                الفواتير
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">جاري التحميل...</div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="إجمالي المستحقات"
                  value={totalReceivables}
                  icon={DollarSign}
                  suffix=" جنيه"
                />
                <StatCard
                  title="المستحقات المتأخرة"
                  value={totalOverdue}
                  icon={AlertTriangle}
                  suffix=" جنيه"
                  variant="danger"
                />
                <StatCard
                  title="عملاء لديهم مستحقات"
                  value={totalCustomersWithDebt}
                  icon={Users}
                />
                <StatCard
                  title="معدل التحصيل"
                  value={Math.round(collectionRate)}
                  icon={TrendingUp}
                  suffix="%"
                  variant="success"
                />
              </div>

              {/* Aging Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    تحليل أعمار الديون
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agingBuckets.map((bucket, index) => {
                      const percentage = totalReceivables > 0 
                        ? (bucket.amount / totalReceivables) * 100 
                        : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${bucket.color}`} />
                              <span>{bucket.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {bucket.count} فاتورة
                              </Badge>
                            </div>
                            <span className="font-medium">
                              {bucket.amount.toLocaleString()} جنيه ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Debtors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      أكبر المديونين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerDebts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        لا توجد مستحقات
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {customerDebts.slice(0, 5).map((customer, index) => (
                          <div
                            key={customer.customerId}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium">{customer.customerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {customer.invoicesCount} فاتورة
                                </p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold">{customer.totalDebt.toLocaleString()} جنيه</p>
                              {customer.overdueAmount > 0 && (
                                <p className="text-sm text-destructive">
                                  متأخر: {customer.overdueAmount.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Overdue */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      الفواتير المتأخرة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unpaidInvoices.filter(i => i.days_overdue > 0).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        لا توجد فواتير متأخرة
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {unpaidInvoices
                          .filter(i => i.days_overdue > 0)
                          .slice(0, 5)
                          .map((invoice) => (
                            <div
                              key={invoice.id}
                              className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{invoice.invoice_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {invoice.customer_name}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-destructive">
                                  {invoice.remaining.toLocaleString()} جنيه
                                </p>
                                <p className="text-xs text-destructive">
                                  متأخر {invoice.days_overdue} يوم
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* All Unpaid Invoices Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    جميع الفواتير غير المسددة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم الفاتورة</TableHead>
                          <TableHead>العميل</TableHead>
                          <TableHead>الإجمالي</TableHead>
                          <TableHead>المدفوع</TableHead>
                          <TableHead>المتبقي</TableHead>
                          <TableHead>تاريخ الاستحقاق</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unpaidInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              لا توجد فواتير غير مسددة
                            </TableCell>
                          </TableRow>
                        ) : (
                          unpaidInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">
                                {invoice.invoice_number}
                              </TableCell>
                              <TableCell>{invoice.customer_name}</TableCell>
                              <TableCell>{invoice.total.toLocaleString()} جنيه</TableCell>
                              <TableCell className="text-green-600">
                                {invoice.paid_amount.toLocaleString()} جنيه
                              </TableCell>
                              <TableCell className="font-bold text-destructive">
                                {invoice.remaining.toLocaleString()} جنيه
                              </TableCell>
                              <TableCell>
                                {invoice.due_date
                                  ? format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ar })
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(invoice.status, invoice.days_overdue)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate("/invoices")}
                                >
                                  <CreditCard className="w-4 h-4 ml-1" />
                                  سداد
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Receivables;
