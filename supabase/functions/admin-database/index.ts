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

        // Safety check: Only the super admin email can access the database directly
        if (!caller || caller.email !== 'admin@chatvox.com.br') {
            return new Response(JSON.stringify({ error: "Unauthorized: Super Admin only" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { action, table, data, id, query } = await req.json();

        if (action === "list_tables") {
            // Query information_schema for public tables
            const { data: tables, error } = await supabase.rpc('get_tables');

            // Fallback if RPC doesn't exist: return a known list or error
            if (error) {
                // Since we can't easily run dynamic SQL without an RPC, 
                // we'll advise the user to create the helper rpc.
                return new Response(JSON.stringify({
                    error: "RPC 'get_tables' not found. Please run the migration SQL provided in the documentation.",
                    migration: `
            CREATE OR REPLACE FUNCTION get_tables()
            RETURNS TABLE(table_name text) 
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              RETURN QUERY SELECT t.table_name::text FROM information_schema.tables t WHERE t.table_schema = 'public';
            END;
            $$;
          `
                }), {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ tables }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === "get_data") {
            const { data: rows, error } = await supabase
                .from(table)
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            return new Response(JSON.stringify({ rows }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === "update_row") {
            const { error } = await supabase
                .from(table)
                .update(data)
                .eq("id", id);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === "delete_row") {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq("id", id);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === "exec_sql") {
            const { data: result, error } = await supabase.rpc('exec_sql', { sql: query });
            if (error) {
                return new Response(JSON.stringify({
                    error: "RPC 'exec_sql' not found or failed.",
                    migration: `
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS jsonb
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            DECLARE
              result jsonb;
            BEGIN
              EXECUTE 'SELECT jsonb_agg(t) FROM (' || sql || ') t' INTO result;
              RETURN result;
            END;
            $$;
          `
                }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
            return new Response(JSON.stringify({ result }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Unknown action" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
