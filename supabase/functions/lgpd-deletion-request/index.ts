import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, reason } = await req.json();

    if (!email && !phone) {
      return new Response(
        JSON.stringify({ error: "E-mail ou telefone é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the deletion request
    await supabase.from("lgpd_requests").insert({
      email: email || null,
      phone: phone || null,
      reason: reason || null,
      request_type: "deletion",
      status: "pending",
    });

    // Find and flag matching leads for deletion
    let matchCount = 0;

    if (email) {
      const { data } = await supabase
        .from("vox_leads")
        .select("id")
        .eq("email", email);
      matchCount += data?.length || 0;
    }

    if (phone) {
      const { data } = await supabase
        .from("vox_leads")
        .select("id")
        .eq("phone", phone);
      matchCount += data?.length || 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitação registrada com sucesso.",
        matches_found: matchCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("LGPD deletion request error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
