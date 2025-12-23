import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: string;
  company_id: string;
  company_name: string;
  inviter_name: string;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send invitation function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { email, role, company_id, company_name, inviter_name }: InviteRequest = await req.json();

    console.log("Invitation request:", { email, role, company_id, company_name });

    // Check if user already exists in company
    const { data: existingUser } = await supabase
      .from("company_users")
      .select("id")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from("user_invitations")
      .select("id, status")
      .eq("company_id", company_id)
      .eq("email", email)
      .maybeSingle();

    if (existingInvitation && existingInvitation.status === "pending") {
      return new Response(
        JSON.stringify({ error: "invitation_exists", message: "تم إرسال دعوة لهذا البريد مسبقاً" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique token
    const token = generateToken();
    const appUrl = Deno.env.get("APP_URL") || "https://lovable.dev";
    const inviteLink = `${appUrl}/accept-invitation?token=${token}`;

    // Create or update invitation
    if (existingInvitation) {
      await supabase
        .from("user_invitations")
        .update({
          token,
          role,
          status: "pending",
          invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", existingInvitation.id);
    } else {
      await supabase
        .from("user_invitations")
        .insert({
          company_id,
          invited_by: user.id,
          email,
          role,
          token,
        });
    }

    // Send email
    const roleLabels: Record<string, string> = {
      admin: "مدير",
      moderator: "مشرف",
      user: "مستخدم",
    };

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [email],
      subject: `دعوة للانضمام إلى ${company_name}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">دعوة للانضمام</h1>
            </div>
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">مرحباً،</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                لقد قام <strong>${inviter_name}</strong> بدعوتك للانضمام إلى 
                <strong>${company_name}</strong> بصفة <strong>${roleLabels[role] || role}</strong>.
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                  قبول الدعوة
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center;">
                هذه الدعوة صالحة لمدة 7 أيام
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", emailResponse);

    // Create audit log
    await supabase
      .from("audit_logs")
      .insert({
        company_id,
        user_id: user.id,
        action_type: "invitation_sent",
        target_type: "invitation",
        new_value: { email, role },
      });

    return new Response(
      JSON.stringify({ success: true, message: "تم إرسال الدعوة بنجاح" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
