import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Interface para resposta de token
interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const { plan_slug, user_id, method = "pix" } = await req.json();

        if (!plan_slug || !user_id) {
            return new Response(JSON.stringify({ error: "plan_slug and user_id are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Buscar plano e VALIDAR USUÁRIO
        const { data: plan, error: planError } = await supabase
            .from("plans")
            .select("*")
            .eq("slug", plan_slug)
            .single();

        if (planError || !plan) {
            return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: userProfile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user_id)
            .single();

        if (profileError || !userProfile) {
            console.error(`[vox-payments] Usuário ${user_id} não encontrado no banco de dados novo.`);
            return new Response(JSON.stringify({
                error: "Sessão expirada ou usuário não encontrado. Por favor, faça logout e entre novamente."
            }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`[vox-payments] Gerando cobrança para ${plan.name} (R$ ${plan.price_brl / 100})`);
        // 2. Buscar Credenciais Efí (Priorizando Variáveis de Ambiente/Secrets)
        const clientId = Deno.env.get("EFIPAY_CLIENT_ID");
        const clientSecret = Deno.env.get("EFIPAY_CLIENT_SECRET");
        const pixKey = Deno.env.get("EFIPAY_PIX_KEY");
        const isSandbox = Deno.env.get("EFIPAY_SANDBOX") === "true";

        console.log(`[vox-payments] Iniciando processamento para plano: ${plan_slug} - User: ${user_id}`);

        if (!clientId || !clientSecret) {
            return new Response(JSON.stringify({ error: "Credenciais Efí não configuradas" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const authUrl = isSandbox
            ? "https://pix-h.gerencianet.com.br/oauth/token"
            : "https://pix.gerencianet.com.br/oauth/token";

        const apiBaseUrl = isSandbox
            ? "https://pix-h.gerencianet.com.br"
            : "https://pix.gerencianet.com.br";

        // 3. Autenticação OAuth (Basic Auth)
        const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

        console.log(`[vox-payments] Autenticando com Efí: CID=${clientId.substring(0, 10)}... URL=${authUrl}`);

        const tokenRes = await fetch(authUrl, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ grant_type: "client_credentials" })
        });

        if (!tokenRes.ok) {
            const errBody = await tokenRes.text();
            console.error(`[vox-payments] Erro na autenticação Efí: ${tokenRes.status} - ${errBody}`);
            throw new Error(`Falha na autenticação Efí: ${errBody}`);
        }

        const tokenData: TokenResponse = await tokenRes.json();
        const accessToken = tokenData.access_token;
        console.log("[vox-payments] Token obtido com sucesso.");

        // 4. Fluxo Pix Master (Forçado Estático para Estabilidade de Lançamento)
        if (method === "pix") {
            if (!pixKey) throw new Error("Chave Pix não configurada (EFIPAY_PIX_KEY)");

            const txid = `VOX${Date.now()}${(Math.random() * 1000).toFixed(0)}`.toUpperCase();

            // FUNÇÃO GERADORA DE PIX ESTÁTICO (BR CODE) - PADRÃO BACEN
            const crc16 = (str: string) => {
                let crc = 0xFFFF;
                for (let i = 0; i < str.length; i++) {
                    crc ^= str.charCodeAt(i) << 8;
                    for (let j = 0; j < 8; j++) {
                        if ((crc & 0x8000) > 0) crc = (crc << 1) ^ 0x1021;
                        else crc = crc << 1;
                    }
                }
                return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
            };

            const len = (s: string) => s.length.toString().padStart(2, '0');
            const amtStr = (plan.price_brl / 100).toFixed(2);

            const gui = "0014br.gov.bcb.pix";
            const mk = `01${len(pixKey)}${pixKey}`;
            const merchantAccount = `26${len(gui + mk)}${gui}${mk}`;
            const amountDef = `54${len(amtStr)}${amtStr}`;
            const mName = "CHATVOX";
            const mCity = "BRASILIA";
            const addData = `62${len(`05${len(txid)}${txid}`)}05${len(txid)}${txid}`;

            const payloadRaw = `000201${merchantAccount}520400005303986${amountDef}5802BR59${len(mName)}${mName}60${len(mCity)}${mCity}${addData}6304`;
            const validPixCopiaECola = payloadRaw + crc16(payloadRaw);

            console.log(`[vox-payments] Gerando Pix Estático Master: ${txid}`);

            // Registrar no Banco
            const { data: payment, error: insertError } = await supabase
                .from("vox_payments")
                .insert({
                    user_id,
                    plan_slug,
                    amount_cents: plan.price_brl,
                    status: "pending",
                    pix_id: txid,
                    pix_copiapasta: validPixCopiaECola,
                    metadata: { sandbox: isSandbox, master_pix: true, price: amtStr }
                })
                .select()
                .single();

            if (insertError || !payment) {
                console.error("[vox-payments] Erro ao registrar no banco:", insertError);
                throw new Error("Erro de banco de dados ao gerar Pix.");
            }

            return new Response(JSON.stringify({
                payment_id: payment.id,
                copiapasta: validPixCopiaECola,
                amount: plan.price_brl,
                txid: txid,
                qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(validPixCopiaECola)}`
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: "Método de pagamento não suportado" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[vox-payments] erro fatal:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
