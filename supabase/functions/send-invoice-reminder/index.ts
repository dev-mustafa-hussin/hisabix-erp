import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  invoiceId?: string;
  companyId?: string;
  sendAll?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invoice-reminder function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId, companyId, sendAll }: ReminderRequest = await req.json();
    console.log("Request params:", { invoiceId, companyId, sendAll });

    let invoices = [];

    if (invoiceId) {
      // Send reminder for specific invoice
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(name, email),
          company:companies(name, email)
        `)
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      if (data) invoices = [data];
    } else if (companyId && sendAll) {
      // Send reminders for all overdue invoices
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(name, email),
          company:companies(name, email)
        `)
        .eq("company_id", companyId)
        .eq("status", "overdue")
        .not("customer_id", "is", null);

      if (error) throw error;
      invoices = data || [];
    }

    console.log(`Found ${invoices.length} invoices to send reminders for`);

    const results = [];

    for (const invoice of invoices) {
      const customerEmail = invoice.customer?.email;
      const customerName = invoice.customer?.name || "عميل";
      const companyName = invoice.company?.name || "الشركة";
      const remaining = invoice.total - invoice.paid_amount;

      if (!customerEmail) {
        console.log(`Skipping invoice ${invoice.invoice_number} - no customer email`);
        results.push({
          invoiceId: invoice.id,
          success: false,
          error: "لا يوجد بريد إلكتروني للعميل",
        });
        continue;
      }

      const dueDate = invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString("ar-EG")
        : "غير محدد";

      const emailHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .amount { font-size: 24px; color: #dc2626; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ تذكير بفاتورة متأخرة</h1>
            </div>
            <div class="content">
              <p>عزيزي ${customerName}،</p>
              <p>نود تذكيرك بأن لديك فاتورة متأخرة عن موعد السداد. نرجو منك سداد المبلغ المستحق في أقرب وقت ممكن.</p>
              
              <div class="invoice-details">
                <p><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</p>
                <p><strong>تاريخ الاستحقاق:</strong> ${dueDate}</p>
                <p><strong>المبلغ الإجمالي:</strong> ${invoice.total.toFixed(2)} جنيه</p>
                <p><strong>المبلغ المدفوع:</strong> ${invoice.paid_amount.toFixed(2)} جنيه</p>
                <p><strong>المبلغ المتبقي:</strong> <span class="amount">${remaining.toFixed(2)} جنيه</span></p>
              </div>
              
              <p>إذا كنت قد قمت بالسداد بالفعل، يرجى تجاهل هذه الرسالة أو التواصل معنا لتحديث السجلات.</p>
              
              <p>شكراً لتعاونكم.</p>
              <p>مع أطيب التحيات،<br><strong>${companyName}</strong></p>
            </div>
            <div class="footer">
              <p>هذه رسالة تذكير آلية. للاستفسار يرجى التواصل مع قسم المحاسبة.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: `${companyName} <onboarding@resend.dev>`,
          to: [customerEmail],
          subject: `تذكير: فاتورة متأخرة رقم ${invoice.invoice_number}`,
          html: emailHtml,
        });

        console.log("Email sent successfully:", emailResponse);
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          customerEmail,
          success: true,
        });
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          success: false,
          error: emailError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-reminder function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
