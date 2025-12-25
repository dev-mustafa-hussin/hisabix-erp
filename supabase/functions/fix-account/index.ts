import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use Service Role Key to bypass RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the user from the authorization header (JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) throw new Error("Invalid token");

    console.log(`Checking account status for user: ${user.id} (${user.email})`);

    // 1. Check Profile
    let { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      console.log("Profile missing, creating...");
      const username = user.email?.split("@")[0] || "admin";
      const { data: newProfile, error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || username,
          username: username,
        })
        .select()
        .single();

      if (profileError) throw profileError;
      profile = newProfile;
    }

    // 2. Check Company Link
    let { data: companyUser } = await supabaseClient
      .from("company_users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!companyUser) {
      console.log("Company link missing, creating company...");

      // Create new company
      const { data: newCompany, error: companyError } = await supabaseClient
        .from("companies")
        .insert({
          name: "My Company",
          currency: "EGP",
          timezone: "Africa/Cairo",
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Link user
      const { error: linkError } = await supabaseClient
        .from("company_users")
        .insert({
          company_id: newCompany.id,
          user_id: user.id,
          role: "admin",
          is_owner: true,
        });

      if (linkError) throw linkError;

      // Ensure user_roles
      await supabaseClient
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin" });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Account repaired successfully",
          fixed: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account is already healthy",
        fixed: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in fix-account:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
