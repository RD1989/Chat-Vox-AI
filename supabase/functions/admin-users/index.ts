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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, user_id } = await req.json();

    if (action === "toggle_active") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user_id)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newStatus = !(profile as any).is_active;
      await supabase
        .from("profiles")
        .update({ is_active: newStatus } as any)
        .eq("id", user_id);

      return new Response(JSON.stringify({ success: true, is_active: newStatus }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      const { error } = await supabase.auth.admin.deleteUser(user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_users") {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profiles } = await supabase.from("profiles").select("*");

      // Get all leads with qualification data
      const { data: allLeads } = await supabase
        .from("vox_leads")
        .select("user_id, qualified, qualification_score, status, created_at, city, region");

      // Get all messages with type
      const { data: allMessages } = await supabase
        .from("vox_messages")
        .select("user_id, message_type, created_at");

      const { data: roles } = await supabase.from("user_roles").select("*");

      const enrichedUsers = users.map((u) => {
        const profile = profiles?.find((p: any) => p.id === u.id) as any;
        const userLeads = allLeads?.filter((l: any) => l.user_id === u.id) || [];
        const userMsgs = allMessages?.filter((m: any) => m.user_id === u.id) || [];
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];

        const qualifiedLeads = userLeads.filter((l: any) => l.qualified).length;
        const interactiveMsgs = userMsgs.filter((m: any) => m.message_type === "interactive").length;
        const avgScore = userLeads.length > 0
          ? Math.round(userLeads.reduce((sum: number, l: any) => sum + (l.qualification_score || 0), 0) / userLeads.length)
          : 0;

        // Top cities for this user
        const cityCount: Record<string, number> = {};
        userLeads.forEach((l: any) => {
          if (l.city) cityCount[l.city] = (cityCount[l.city] || 0) + 1;
        });
        const topCities = Object.entries(cityCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([city, count]) => ({ city, count }));

        // Top regions for this user
        const regionCount: Record<string, number> = {};
        userLeads.forEach((l: any) => {
          if (l.region) regionCount[l.region] = (regionCount[l.region] || 0) + 1;
        });
        const topRegions = Object.entries(regionCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([region, count]) => ({ region, count }));

        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          full_name: profile?.full_name || "",
          company_name: profile?.company_name || null,
          plan: profile?.plan || "free",
          is_active: profile?.is_active ?? true,
          avatar_url: profile?.avatar_url || null,
          leads_count: userLeads.length,
          qualified_leads: qualifiedLeads,
          messages_count: userMsgs.length,
          interactive_messages: interactiveMsgs,
          avg_score: avgScore,
          conversion_rate: userLeads.length > 0 ? Math.round((qualifiedLeads / userLeads.length) * 100) : 0,
          top_cities: topCities,
          top_regions: topRegions,
          roles: userRoles,
        };
      });

      return new Response(JSON.stringify({ users: enrichedUsers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_geo_stats") {
      const { data: leads } = await supabase
        .from("vox_leads")
        .select("city, region, created_at, qualified, qualification_score, user_id");

      return new Response(JSON.stringify({ leads: leads || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-users error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
