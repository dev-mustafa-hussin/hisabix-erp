import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay(); // 0=Sunday, 6=Saturday

    console.log(`Processing scheduled alerts at hour: ${currentHour}, day: ${currentDay}`);

    // Get all active schedules that match current time
    const { data: schedules, error: schedulesError } = await supabase
      .from("stock_alert_schedules")
      .select("*, company:companies(id, name, email)")
      .eq("is_active", true)
      .neq("schedule_type", "disabled");

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} active schedules`);

    const results = [];

    for (const schedule of schedules || []) {
      // Check if this schedule should run now
      const shouldRun = 
        schedule.daily_hour === currentHour &&
        (schedule.schedule_type === "daily" || 
         (schedule.schedule_type === "weekly" && schedule.weekly_day === currentDay));

      if (!shouldRun) {
        continue;
      }

      // Check if already sent today
      if (schedule.last_sent_at) {
        const lastSent = new Date(schedule.last_sent_at);
        const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        
        if (schedule.schedule_type === "daily" && hoursSinceLastSent < 23) {
          console.log(`Skipping ${schedule.company.name} - already sent today`);
          continue;
        }
        if (schedule.schedule_type === "weekly" && hoursSinceLastSent < 167) {
          console.log(`Skipping ${schedule.company.name} - already sent this week`);
          continue;
        }
      }

      if (!schedule.company?.email) {
        console.log(`Skipping ${schedule.company?.name} - no email configured`);
        continue;
      }

      console.log(`Processing alert for company: ${schedule.company.name}`);

      // Get products with low or zero stock
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, name_ar, quantity, min_quantity")
        .eq("company_id", schedule.company_id)
        .eq("is_active", true);

      if (productsError) {
        console.error(`Error fetching products for ${schedule.company.name}:`, productsError);
        continue;
      }

      const outOfStock = products?.filter((p) => p.quantity === 0) || [];
      const lowStock = products?.filter(
        (p) => p.quantity > 0 && p.quantity <= p.min_quantity && p.min_quantity > 0
      ) || [];

      if (outOfStock.length === 0 && lowStock.length === 0) {
        console.log(`No stock alerts needed for ${schedule.company.name}`);
        continue;
      }

      // Build email content
      const outOfStockHtml = outOfStock.length > 0 
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

      const lowStockHtml = lowStock.length > 0 
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

      const scheduleTypeText = schedule.schedule_type === "daily" ? "يومي" : "أسبوعي";

      const emailHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #1f2937; text-align: center; margin-bottom: 10px;">🏪 ${schedule.company.name}</h1>
            <h2 style="color: #374151; text-align: center; margin-top: 0;">تنبيه المخزون ${scheduleTypeText}</h2>
            
            <p style="color: #6b7280; text-align: center; margin-bottom: 30px;">
              هناك ${outOfStock.length + lowStock.length} منتج يحتاج إلى اهتمامك
            </p>

            ${outOfStockHtml}
            ${lowStockHtml}

            <div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #0369a1;">
                يرجى مراجعة المخزون وإعادة تعبئة المنتجات المنخفضة
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              هذا البريد تم إرساله تلقائياً من نظام EDOXO (تنبيه ${scheduleTypeText})
            </p>
          </div>
        </body>
        </html>
      `;

      // Send email
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "EDOXO <onboarding@resend.dev>",
          to: [schedule.company.email],
          subject: `⚠️ تنبيه المخزون ${scheduleTypeText} - ${schedule.company.name} (${outOfStock.length + lowStock.length} منتج)`,
          html: emailHtml,
        }),
      });

      const emailData = await emailResponse.json();
      console.log(`Email sent to ${schedule.company.email}:`, emailData);

      // Update last_sent_at
      await supabase
        .from("stock_alert_schedules")
        .update({ last_sent_at: now.toISOString() })
        .eq("id", schedule.id);

      results.push({
        company: schedule.company.name,
        email: schedule.company.email,
        out_of_stock: outOfStock.length,
        low_stock: lowStock.length,
      });
    }

    console.log(`Processed ${results.length} alerts successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing scheduled alerts:", error);
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
