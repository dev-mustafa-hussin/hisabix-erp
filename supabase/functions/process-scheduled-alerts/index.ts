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

    const results: any[] = [];

    // =============== STOCK ALERTS ===============
    const { data: schedules, error: schedulesError } = await supabase
      .from("stock_alert_schedules")
      .select("*, company:companies(id, name, email)")
      .eq("is_active", true)
      .neq("schedule_type", "disabled");

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} active stock alert schedules`);

    for (const schedule of schedules || []) {
      const shouldRun = 
        schedule.daily_hour === currentHour &&
        (schedule.schedule_type === "daily" || 
         (schedule.schedule_type === "weekly" && schedule.weekly_day === currentDay));

      if (!shouldRun) continue;

      if (schedule.last_sent_at) {
        const lastSent = new Date(schedule.last_sent_at);
        const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        
        if (schedule.schedule_type === "daily" && hoursSinceLastSent < 23) {
          console.log(`Skipping stock alert for ${schedule.company.name} - already sent today`);
          continue;
        }
        if (schedule.schedule_type === "weekly" && hoursSinceLastSent < 167) {
          console.log(`Skipping stock alert for ${schedule.company.name} - already sent this week`);
          continue;
        }
      }

      if (!schedule.company?.email) {
        console.log(`Skipping ${schedule.company?.name} - no email configured`);
        continue;
      }

      console.log(`Processing stock alert for company: ${schedule.company.name}`);

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
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #1f2937; text-align: center; margin-bottom: 10px;">🏪 ${schedule.company.name}</h1>
            <h2 style="color: #374151; text-align: center; margin-top: 0;">تنبيه المخزون ${scheduleTypeText}</h2>
            <p style="color: #6b7280; text-align: center; margin-bottom: 30px;">هناك ${outOfStock.length + lowStock.length} منتج يحتاج إلى اهتمامك</p>
            ${outOfStockHtml}
            ${lowStockHtml}
            <div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #0369a1;">يرجى مراجعة المخزون وإعادة تعبئة المنتجات المنخفضة</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">هذا البريد تم إرساله تلقائياً من نظام EDOXO (تنبيه ${scheduleTypeText})</p>
          </div>
        </body>
        </html>
      `;

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
      console.log(`Stock alert email sent to ${schedule.company.email}:`, emailData);

      await supabase
        .from("stock_alert_schedules")
        .update({ last_sent_at: now.toISOString() })
        .eq("id", schedule.id);

      // Log notification
      await supabase.from("notification_logs").insert({
        company_id: schedule.company_id,
        notification_type: 'stock_alert_scheduled',
        recipient_email: schedule.company.email,
        subject: `⚠️ تنبيه المخزون ${scheduleTypeText} - ${schedule.company.name}`,
        status: emailResponse.ok ? 'sent' : 'failed',
        error_message: emailResponse.ok ? null : emailData.message,
        metadata: {
          schedule_type: schedule.schedule_type,
          out_of_stock_count: outOfStock.length,
          low_stock_count: lowStock.length,
        }
      });

      results.push({
        type: 'stock_alert',
        company: schedule.company.name,
        email: schedule.company.email,
        out_of_stock: outOfStock.length,
        low_stock: lowStock.length,
      });
    }

    // =============== MOVEMENT CHANGE ALERTS ===============
    const { data: movementAlerts, error: movementAlertsError } = await supabase
      .from("movement_change_alerts")
      .select("*, company:companies(id, name, email)")
      .eq("is_active", true)
      .neq("schedule_type", "disabled");

    if (movementAlertsError) {
      console.error("Error fetching movement alerts:", movementAlertsError);
    } else {
      console.log(`Found ${movementAlerts?.length || 0} active movement change alert schedules`);

      for (const alert of movementAlerts || []) {
        const shouldRun = 
          alert.schedule_hour === currentHour &&
          (alert.schedule_type === "daily" || 
           (alert.schedule_type === "weekly" && alert.schedule_day === currentDay));

        if (!shouldRun) continue;

        if (alert.last_checked_at) {
          const lastChecked = new Date(alert.last_checked_at);
          const hoursSinceLastChecked = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);
          
          if (alert.schedule_type === "daily" && hoursSinceLastChecked < 23) {
            console.log(`Skipping movement alert for ${alert.company.name} - already checked today`);
            continue;
          }
          if (alert.schedule_type === "weekly" && hoursSinceLastChecked < 167) {
            console.log(`Skipping movement alert for ${alert.company.name} - already checked this week`);
            continue;
          }
        }

        const recipientEmail = alert.recipient_email || alert.company?.email;
        if (!recipientEmail) {
          console.log(`Skipping movement alert for ${alert.company?.name} - no email configured`);
          continue;
        }

        console.log(`Processing movement change alert for company: ${alert.company.name}`);

        // Calculate date ranges
        const comparisonDays = alert.comparison_days || 7;
        const period2End = now;
        const period2Start = new Date(now.getTime() - (comparisonDays * 24 * 60 * 60 * 1000));
        const period1End = period2Start;
        const period1Start = new Date(period1End.getTime() - (comparisonDays * 24 * 60 * 60 * 1000));

        // Get products
        const { data: products } = await supabase
          .from("products")
          .select("id, name, name_ar")
          .eq("company_id", alert.company_id)
          .eq("is_active", true);

        // Get movements for both periods
        const { data: movements1 } = await supabase
          .from("stock_movements")
          .select("*")
          .eq("company_id", alert.company_id)
          .gte("created_at", period1Start.toISOString())
          .lt("created_at", period1End.toISOString());

        const { data: movements2 } = await supabase
          .from("stock_movements")
          .select("*")
          .eq("company_id", alert.company_id)
          .gte("created_at", period2Start.toISOString())
          .lte("created_at", period2End.toISOString());

        // Calculate movements
        const productMovements: { [id: string]: { period1: number; period2: number } } = {};
        (products || []).forEach(p => { productMovements[p.id] = { period1: 0, period2: 0 }; });

        (movements1 || []).forEach(m => {
          if (!productMovements[m.product_id]) productMovements[m.product_id] = { period1: 0, period2: 0 };
          productMovements[m.product_id].period1 += m.quantity;
        });

        (movements2 || []).forEach(m => {
          if (!productMovements[m.product_id]) productMovements[m.product_id] = { period1: 0, period2: 0 };
          productMovements[m.product_id].period2 += m.quantity;
        });

        // Find significant changes
        const thresholdPercent = alert.threshold_percent || 50;
        const significantChanges: any[] = [];

        Object.entries(productMovements).forEach(([productId, movements]) => {
          const { period1, period2 } = movements;
          if (period1 === 0 && period2 === 0) return;

          let changePercent = period1 === 0 ? (period2 > 0 ? 100 : 0) : Math.abs(((period2 - period1) / period1) * 100);

          if (changePercent >= thresholdPercent) {
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

        significantChanges.sort((a, b) => b.change_percent - a.change_percent);

        // Update last_checked_at
        await supabase
          .from("movement_change_alerts")
          .update({ last_checked_at: now.toISOString() })
          .eq("id", alert.id);

        if (significantChanges.length === 0) {
          console.log(`No significant movement changes for ${alert.company.name}`);
          continue;
        }

        // Build and send email
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

        const scheduleTypeText = alert.schedule_type === "daily" ? "يومي" : "أسبوعي";
        const emailSubject = `📊 تنبيه تغييرات المخزون ${scheduleTypeText} - ${alert.company.name} (${significantChanges.length} منتج)`;

        const movementEmailHtml = `<!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1f2937; text-align: center;">🏪 ${alert.company.name}</h1>
              <h2 style="color: #374151; text-align: center;">تنبيه تغييرات حركة المخزون ${scheduleTypeText}</h2>
              <p style="color: #6b7280; text-align: center;">تم رصد ${significantChanges.length} منتج بتغييرات تتجاوز ${thresholdPercent}%</p>
              <p style="color: #9ca3af; text-align: center; font-size: 12px;">مقارنة آخر ${comparisonDays} يوم بالفترة السابقة</p>
              ${increaseTableHtml}
              ${decreaseTableHtml}
              <div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #0369a1;">يرجى مراجعة هذه التغييرات واتخاذ الإجراءات المناسبة</p>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">هذا البريد تم إرساله تلقائياً من نظام EDOXO (تنبيه ${scheduleTypeText})</p>
            </div>
          </body>
          </html>`;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "EDOXO <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: emailSubject,
            html: movementEmailHtml,
          }),
        });

        const emailData = await emailResponse.json();
        console.log(`Movement change email sent to ${recipientEmail}:`, emailData);

        // Log notification
        await supabase.from("notification_logs").insert({
          company_id: alert.company_id,
          notification_type: 'movement_change_alert_scheduled',
          recipient_email: recipientEmail,
          subject: emailSubject,
          status: emailResponse.ok ? 'sent' : 'failed',
          error_message: emailResponse.ok ? null : emailData.message,
          metadata: {
            schedule_type: alert.schedule_type,
            threshold_percent: thresholdPercent,
            comparison_days: comparisonDays,
            total_changes: significantChanges.length,
            increase_count: increaseChanges.length,
            decrease_count: decreaseChanges.length,
          }
        });

        results.push({
          type: 'movement_change_alert',
          company: alert.company.name,
          email: recipientEmail,
          changes_count: significantChanges.length,
        });
      }
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
