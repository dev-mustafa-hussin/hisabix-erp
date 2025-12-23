import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StockAlertRequest {
  company_id: string;
  recipient_email: string;
  company_name: string;
}

const defaultSubject = "⚠️ تنبيه المخزون - {{company_name}} ({{total_products}} منتج)";
const defaultBodyHtml = `<h1 style="color: #1f2937; text-align: center;">🏪 {{company_name}}</h1>
<h2 style="color: #374151; text-align: center;">تنبيه المخزون</h2>
<p style="color: #6b7280; text-align: center;">هناك {{total_products}} منتج يحتاج إلى اهتمامك</p>
{{out_of_stock_table}}
{{low_stock_table}}
<div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
  <p style="margin: 0; color: #0369a1;">يرجى مراجعة المخزون وإعادة تعبئة المنتجات المنخفضة</p>
</div>`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { company_id, recipient_email, company_name }: StockAlertRequest = await req.json();

    console.log(`Fetching low stock products for company: ${company_id}`);

    // Get custom email template if exists
    const { data: templateData } = await supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("company_id", company_id)
      .eq("template_type", "stock_alert")
      .eq("is_active", true)
      .maybeSingle();

    const emailSubject = templateData?.subject || defaultSubject;
    const emailBodyTemplate = templateData?.body_html || defaultBodyHtml;

    console.log(`Using ${templateData ? 'custom' : 'default'} email template`);

    // Get products with low or zero stock
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, name_ar, quantity, min_quantity")
      .eq("company_id", company_id)
      .eq("is_active", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw productsError;
    }

    // Filter low stock and out of stock products
    const outOfStock = products?.filter((p) => p.quantity === 0) || [];
    const lowStock = products?.filter(
      (p) => p.quantity > 0 && p.quantity <= p.min_quantity && p.min_quantity > 0
    ) || [];

    if (outOfStock.length === 0 && lowStock.length === 0) {
      console.log("No stock alerts to send");
      return new Response(
        JSON.stringify({ message: "No stock alerts needed" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Build tables HTML
    const outOfStockTableHtml = outOfStock.length > 0 
      ? `
        <h3 style="color: #dc2626; margin-top: 20px;">⚠️ منتجات نفذت من المخزون (${outOfStock.length})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #fef2f2;">
            <th style="padding: 10px; border: 1px solid #fecaca; text-align: right;">المنتج</th>
            <th style="padding: 10px; border: 1px solid #fecaca; text-align: center;">الحد الأدنى</th>
          </tr>
          ${outOfStock.map(p => `
            <tr>
              <td style="padding: 10px; border: 1px solid #fecaca; text-align: right;">${p.name_ar || p.name}</td>
              <td style="padding: 10px; border: 1px solid #fecaca; text-align: center;">${p.min_quantity}</td>
            </tr>
          `).join("")}
        </table>
      ` 
      : "";

    const lowStockTableHtml = lowStock.length > 0 
      ? `
        <h3 style="color: #d97706; margin-top: 20px;">⚡ منتجات بمخزون منخفض (${lowStock.length})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #fffbeb;">
            <th style="padding: 10px; border: 1px solid #fde68a; text-align: right;">المنتج</th>
            <th style="padding: 10px; border: 1px solid #fde68a; text-align: center;">الكمية الحالية</th>
            <th style="padding: 10px; border: 1px solid #fde68a; text-align: center;">الحد الأدنى</th>
          </tr>
          ${lowStock.map(p => `
            <tr>
              <td style="padding: 10px; border: 1px solid #fde68a; text-align: right;">${p.name_ar || p.name}</td>
              <td style="padding: 10px; border: 1px solid #fde68a; text-align: center; font-weight: bold; color: #d97706;">${p.quantity}</td>
              <td style="padding: 10px; border: 1px solid #fde68a; text-align: center;">${p.min_quantity}</td>
            </tr>
          `).join("")}
        </table>
      ` 
      : "";

    const totalProducts = outOfStock.length + lowStock.length;

    // Replace template variables
    const finalSubject = emailSubject
      .replace(/\{\{company_name\}\}/g, company_name)
      .replace(/\{\{total_products\}\}/g, totalProducts.toString())
      .replace(/\{\{out_of_stock_count\}\}/g, outOfStock.length.toString())
      .replace(/\{\{low_stock_count\}\}/g, lowStock.length.toString());

    const finalBody = emailBodyTemplate
      .replace(/\{\{company_name\}\}/g, company_name)
      .replace(/\{\{total_products\}\}/g, totalProducts.toString())
      .replace(/\{\{out_of_stock_count\}\}/g, outOfStock.length.toString())
      .replace(/\{\{low_stock_count\}\}/g, lowStock.length.toString())
      .replace(/\{\{out_of_stock_table\}\}/g, outOfStockTableHtml)
      .replace(/\{\{low_stock_table\}\}/g, lowStockTableHtml);

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${finalBody}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            هذا البريد تم إرساله تلقائياً من نظام EDOXO
          </p>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending stock alert email to: ${recipient_email}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EDOXO <onboarding@resend.dev>",
        to: [recipient_email],
        subject: finalSubject,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Stock alert sent to ${recipient_email}`,
        out_of_stock_count: outOfStock.length,
        low_stock_count: lowStock.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-stock-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);