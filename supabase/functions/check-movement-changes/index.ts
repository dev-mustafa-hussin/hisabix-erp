import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MovementChangeRequest {
  company_id: string;
  recipient_email: string;
  company_name: string;
  threshold_percent?: number;
  comparison_days?: number;
}

interface ProductChange {
  product_name: string;
  previous_movement: number;
  current_movement: number;
  change_percent: number;
  change_type: "increase" | "decrease";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      company_id, 
      recipient_email, 
      company_name,
      threshold_percent = 50,
      comparison_days = 7
    }: MovementChangeRequest = await req.json();

    console.log(`Checking movement changes for company: ${company_id}, threshold: ${threshold_percent}%, days: ${comparison_days}`);

    // Calculate date ranges
    const now = new Date();
    const period2End = now;
    const period2Start = new Date(now.getTime() - (comparison_days * 24 * 60 * 60 * 1000));
    const period1End = period2Start;
    const period1Start = new Date(period1End.getTime() - (comparison_days * 24 * 60 * 60 * 1000));

    console.log(`Period 1: ${period1Start.toISOString()} to ${period1End.toISOString()}`);
    console.log(`Period 2: ${period2Start.toISOString()} to ${period2End.toISOString()}`);

    // Get products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, name_ar")
      .eq("company_id", company_id)
      .eq("is_active", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw productsError;
    }

    // Get movements for period 1
    const { data: movements1, error: error1 } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("company_id", company_id)
      .gte("created_at", period1Start.toISOString())
      .lt("created_at", period1End.toISOString());

    // Get movements for period 2
    const { data: movements2, error: error2 } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("company_id", company_id)
      .gte("created_at", period2Start.toISOString())
      .lte("created_at", period2End.toISOString());

    if (error1 || error2) {
      console.error("Error fetching movements:", error1 || error2);
      throw error1 || error2;
    }

    // Calculate net movements for each period
    const productMovements: { [productId: string]: { period1: number; period2: number } } = {};

    (products || []).forEach(p => {
      productMovements[p.id] = { period1: 0, period2: 0 };
    });

    // Process period 1 movements
    (movements1 || []).forEach(m => {
      if (!productMovements[m.product_id]) {
        productMovements[m.product_id] = { period1: 0, period2: 0 };
      }
      if (m.movement_type === "in" || m.movement_type === "purchase" || m.movement_type === "adjustment_add") {
        productMovements[m.product_id].period1 += m.quantity;
      } else {
        productMovements[m.product_id].period1 += m.quantity; // out movements are also counted
      }
    });

    // Process period 2 movements
    (movements2 || []).forEach(m => {
      if (!productMovements[m.product_id]) {
        productMovements[m.product_id] = { period1: 0, period2: 0 };
      }
      if (m.movement_type === "in" || m.movement_type === "purchase" || m.movement_type === "adjustment_add") {
        productMovements[m.product_id].period2 += m.quantity;
      } else {
        productMovements[m.product_id].period2 += m.quantity;
      }
    });

    // Find significant changes
    const significantChanges: ProductChange[] = [];

    Object.entries(productMovements).forEach(([productId, movements]) => {
      const { period1, period2 } = movements;
      
      // Skip if both periods have no movement
      if (period1 === 0 && period2 === 0) return;

      let changePercent: number;
      if (period1 === 0) {
        changePercent = period2 > 0 ? 100 : 0;
      } else {
        changePercent = Math.abs(((period2 - period1) / period1) * 100);
      }

      if (changePercent >= threshold_percent) {
        const product = (products || []).find(p => p.id === productId);
        if (product) {
          significantChanges.push({
            product_name: product.name_ar || product.name,
            previous_movement: period1,
            current_movement: period2,
            change_percent: changePercent,
            change_type: period2 >= period1 ? "increase" : "decrease",
          });
        }
      }
    });

    // Sort by change percent descending
    significantChanges.sort((a, b) => b.change_percent - a.change_percent);

    console.log(`Found ${significantChanges.length} significant changes`);

    if (significantChanges.length === 0) {
      console.log("No significant movement changes to report");
      return new Response(
        JSON.stringify({ message: "No significant changes found", changes_count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build email content
    const increaseChanges = significantChanges.filter(c => c.change_type === "increase");
    const decreaseChanges = significantChanges.filter(c => c.change_type === "decrease");

    const increaseTableHtml = increaseChanges.length > 0 
      ? `<h3 style="color: #16a34a; margin-top: 20px;">📈 زيادة كبيرة في الحركة (${increaseChanges.length})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f0fdf4;">
            <th style="padding: 10px; border: 1px solid #bbf7d0; text-align: center;">نسبة التغيير</th>
            <th style="padding: 10px; border: 1px solid #bbf7d0; text-align: center;">الفترة الحالية</th>
            <th style="padding: 10px; border: 1px solid #bbf7d0; text-align: center;">الفترة السابقة</th>
            <th style="padding: 10px; border: 1px solid #bbf7d0; text-align: right;">المنتج</th>
          </tr>
          ${increaseChanges.slice(0, 10).map(c => `<tr>
            <td style="padding: 10px; border: 1px solid #bbf7d0; text-align: center; color: #16a34a; font-weight: bold;">+${c.change_percent.toFixed(1)}%</td>
            <td style="padding: 10px; border: 1px solid #bbf7d0; text-align: center; font-weight: bold;">${c.current_movement}</td>
            <td style="padding: 10px; border: 1px solid #bbf7d0; text-align: center;">${c.previous_movement}</td>
            <td style="padding: 10px; border: 1px solid #bbf7d0; text-align: right;">${c.product_name}</td>
          </tr>`).join("")}
        </table>` 
      : "";

    const decreaseTableHtml = decreaseChanges.length > 0 
      ? `<h3 style="color: #dc2626; margin-top: 20px;">📉 انخفاض كبير في الحركة (${decreaseChanges.length})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #fef2f2;">
            <th style="padding: 10px; border: 1px solid #fecaca; text-align: center;">نسبة التغيير</th>
            <th style="padding: 10px; border: 1px solid #fecaca; text-align: center;">الفترة الحالية</th>
            <th style="padding: 10px; border: 1px solid #fecaca; text-align: center;">الفترة السابقة</th>
            <th style="padding: 10px; border: 1px solid #fecaca; text-align: right;">المنتج</th>
          </tr>
          ${decreaseChanges.slice(0, 10).map(c => `<tr>
            <td style="padding: 10px; border: 1px solid #fecaca; text-align: center; color: #dc2626; font-weight: bold;">-${c.change_percent.toFixed(1)}%</td>
            <td style="padding: 10px; border: 1px solid #fecaca; text-align: center; font-weight: bold;">${c.current_movement}</td>
            <td style="padding: 10px; border: 1px solid #fecaca; text-align: center;">${c.previous_movement}</td>
            <td style="padding: 10px; border: 1px solid #fecaca; text-align: right;">${c.product_name}</td>
          </tr>`).join("")}
        </table>` 
      : "";

    const emailSubject = `📊 تنبيه تغييرات المخزون - ${company_name} (${significantChanges.length} منتج)`;

    const emailHtml = `<!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1f2937; text-align: center;">🏪 ${company_name}</h1>
          <h2 style="color: #374151; text-align: center;">تنبيه تغييرات حركة المخزون</h2>
          <p style="color: #6b7280; text-align: center;">تم رصد ${significantChanges.length} منتج بتغييرات تتجاوز ${threshold_percent}%</p>
          <p style="color: #9ca3af; text-align: center; font-size: 12px;">مقارنة آخر ${comparison_days} يوم بالفترة السابقة</p>
          ${increaseTableHtml}
          ${decreaseTableHtml}
          <div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #0369a1;">يرجى مراجعة هذه التغييرات واتخاذ الإجراءات المناسبة</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">هذا البريد تم إرساله تلقائياً من نظام EDOXO</p>
        </div>
      </body>
      </html>`;

    console.log(`Sending movement change alert to: ${recipient_email}`);

    let emailStatus = 'sent';
    let errorMessage = null;

    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "EDOXO <onboarding@resend.dev>",
          to: [recipient_email],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      const emailData = await emailResponse.json();
      
      if (!emailResponse.ok) {
        emailStatus = 'failed';
        errorMessage = emailData.message || 'Failed to send email';
        console.error("Email sending failed:", emailData);
      } else {
        console.log("Email sent successfully:", emailData);
      }
    } catch (emailError: any) {
      emailStatus = 'failed';
      errorMessage = emailError.message;
      console.error("Email error:", emailError);
    }

    // Log the notification
    await supabase.from("notification_logs").insert({
      company_id,
      notification_type: 'movement_change_alert',
      recipient_email,
      subject: emailSubject,
      status: emailStatus,
      error_message: errorMessage,
      metadata: {
        threshold_percent,
        comparison_days,
        total_changes: significantChanges.length,
        increase_count: increaseChanges.length,
        decrease_count: decreaseChanges.length,
        top_changes: significantChanges.slice(0, 5).map(c => ({
          product: c.product_name,
          change: `${c.change_type === 'increase' ? '+' : '-'}${c.change_percent.toFixed(1)}%`
        }))
      }
    });

    // Update last checked timestamp
    await supabase
      .from("movement_change_alerts")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("company_id", company_id);

    return new Response(
      JSON.stringify({
        success: emailStatus === 'sent',
        message: emailStatus === 'sent' ? `Movement change alert sent to ${recipient_email}` : errorMessage,
        changes_count: significantChanges.length,
        increase_count: increaseChanges.length,
        decrease_count: decreaseChanges.length,
      }),
      { status: emailStatus === 'sent' ? 200 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-movement-changes function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
