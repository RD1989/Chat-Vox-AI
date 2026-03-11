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

    console.log(`[admin-users] Chamada por: ${caller.email} (ID: ${caller.id}). IsAdmin: ${isAdmin}`);

    if (!isAdmin) {
      console.warn(`[admin-users] Acesso NEGADO para ${caller.email}`);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, user_id } = await req.json();
    console.log(`[admin-users] Ação solicitada: ${action}`);

    if (action === "toggle_active") {
      // ... (mantido igual)
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
      console.log(`[admin-users] Deletando usuário: ${user_id}`);
      const { error } = await supabase.auth.admin.deleteUser(user_id);
      if (error) {
        console.error(`[admin-users] Erro ao deletar: ${error.message}`);
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
      console.log("[admin-users] Iniciando list_users...");
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error(`[admin-users] Erro listUsers: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[admin-users] Usuários encontrados no Auth: ${users?.length || 0}`);

      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: allLeads } = await supabase.from("vox_leads").select("user_id, qualified, qualification_score");
      const { data: allMessages } = await supabase.from("vox_messages").select("user_id, message_type");
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: plans } = await supabase.from("plans").select("*");
      const { data: finStats } = await supabase.from("admin_financial_performance").select("*");

      console.log(`[admin-users] Resumo de dados carregados:
        - Perfis: ${profiles?.length || 0}
        - Leads: ${allLeads?.length || 0}
        - Mensagens: ${allMessages?.length || 0}
        - Roles: ${roles?.length || 0}
        - Planos: ${plans?.length || 0}
        - Fin Stats: ${finStats?.length || 0}
      `);

      const enrichedUsers = users.map((u) => {
        const profile = profiles?.find((p: any) => p.id === u.id) as any;
        const userLeads = allLeads?.filter((l: any) => l.user_id === u.id) || [];
        const userMsgs = allMessages?.filter((m: any) => m.user_id === u.id) || [];
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];
        const userPlan = plans?.find((p: any) => p.slug === (profile?.plan || "free"));

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

        // IA Cost: R$ 0.005 per message (standard)
        const estIaCost = (userMsgs.length * 0.005).toFixed(2);
        const revenue = ((userPlan?.price_brl || 0) / 100).toFixed(2);
        const profit = (parseFloat(revenue) - parseFloat(estIaCost)).toFixed(2);

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
          status: profile?.is_active ? "Ativo" : "Inativo",
          avg_score: avgScore,
          conversion_rate: userLeads.length > 0 ? Math.round((qualifiedLeads / userLeads.length) * 100) : 0,
          revenue: parseFloat(revenue),
          est_ia_cost: parseFloat(estIaCost),
          net_profit: parseFloat(profit),
          top_cities: topCities,
          roles: userRoles,
        };
      });

      return new Response(JSON.stringify({
        users: enrichedUsers,
        financials: finStats
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_geo_stats") {
      console.log("[admin-users] Buscando geo_stats...");
      const { data: leads, error: geoError } = await supabase
        .from("vox_leads")
        .select("city, region, created_at, qualified, qualification_score, user_id");
      
      if (geoError) console.error(`[admin-users] Erro geo_stats: ${geoError.message}`);

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
