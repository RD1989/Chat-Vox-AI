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
        const { email, password, full_name } = await req.json();

        if (!email || !password || !full_name) {
            return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // EXTRAIR IP REAL DO FRONT-END (VERCEL / SUPABASE / CLOUDFLARE)
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";

        console.log(`[vox-signup] Nova tentativa de registro. IP: ${clientIp} - Email: ${email}`);

        // VERIFICAÇÃO ANTI-FRAUDE: 1 CONTA FREE POR IP
        if (clientIp !== "unknown" && clientIp !== "127.0.0.1" && clientIp !== "::1") {
            const { count } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("signup_ip", clientIp)
                .in("plan", ["free", "trial"]);

            if (count && count >= 1) {
                console.warn(`[vox-signup] AVISO ANTI-FRAUDE IP: ${clientIp} já possui conta gratuita. (Bloqueio desativado para o lançamento).`);
                // O Bloqueio 403 foi temporariamente removido para permitir testes e uso da equipe:
                /* return new Response(JSON.stringify({
                    error: "Limite de contas atingido.",
                    details: "Já existe uma conta gratuita registrada a partir desta rede/dispositivo. Para criar uma nova conta, assine um de nossos planos Premium."
                }), {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }); */
            }
        }

        // SE PASSOU NO ANTI-FRAUDE, CRIA O USUÁRIO NO AUTH AUTH
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Já auto-confirma para facilitar on-boarding
            user_metadata: {
                full_name,
            }
        });

        if (authError || !authData.user) {
            console.error("[vox-signup] Falha no supabase.auth:", authError);
            return new Response(JSON.stringify({ error: authError?.message || "Falha ao criar usuário" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ATUALIZAR O PERFIL (Criado via trigger do BD) COM O IP
        await supabase
            .from("profiles")
            .update({
                full_name,
                signup_ip: clientIp
            })
            .eq("id", authData.user.id);

        return new Response(JSON.stringify({
            user: authData.user,
            message: "Conta criada com sucesso."
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[vox-signup] erro fatal:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
