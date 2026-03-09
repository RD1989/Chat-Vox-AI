import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id, lead_id, event_type } = await req.json();

    if (!user_id || !lead_id) {
      return new Response(
        JSON.stringify({ error: "user_id and lead_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's notification settings
    const { data: settings } = await supabase
      .from("vox_settings")
      .select("notify_email, notify_on_new_lead, notify_on_qualified, webhook_url")
      .eq("user_id", user_id)
      .maybeSingle();

    const vs = settings as any;
    if (!vs?.notify_email) {
      return new Response(
        JSON.stringify({ message: "No notification email configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this event type should trigger notification
    if (event_type === "new_lead" && !vs.notify_on_new_lead) {
      return new Response(JSON.stringify({ message: "Notification disabled for new leads" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (event_type === "qualified" && !vs.notify_on_qualified) {
      return new Response(JSON.stringify({ message: "Notification disabled for qualified leads" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get lead data
    const { data: lead } = await supabase
      .from("vox_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (!lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fire webhook if configured
    if (vs.webhook_url) {
      try {
        await fetch(vs.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: event_type === "qualified" ? "lead.qualified" : "lead.created",
            lead,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error("Webhook error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("notify-lead error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
