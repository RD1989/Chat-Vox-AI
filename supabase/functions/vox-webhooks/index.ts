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
        const body = await req.json();
        console.log("[vox-webhooks] Recebido:", JSON.stringify(body));

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fluxo Pix Efí envia um array 'pix' com os pagamentos confirmados
        if (body.pix && Array.isArray(body.pix)) {
            for (const p of body.pix) {
                const txid = p.txid;
                const endToEndId = p.endToEndId;

                console.log(`[vox-webhooks] Processando Pix txid: ${txid}`);

                // 1. Buscar o pagamento pelo txid (pix_id)
                const { data: payment, error: payError } = await supabase
                    .from("vox_payments")
                    .select("*")
                    .eq("pix_id", txid)
                    .single();

                if (payError || !payment) {
                    console.warn(`[vox-webhooks] Pagamento não encontrado para txid ${txid}`);
                    continue;
                }

                if (payment.status === "paid") {
                    console.log(`[vox-webhooks] Pagamento ${txid} já estava marcado como pago.`);
                    continue;
                }

                // 2. Atualizar status do pagamento
                await supabase
                    .from("vox_payments")
                    .update({
                        status: "paid",
                        updated_at: new Date().toISOString(),
                        metadata: { ...payment.metadata, endToEndId }
                    })
                    .eq("id", payment.id);

                // 3. Log de Auditoria
                await supabase.from("vox_payment_logs").insert({
                    payment_id: payment.id,
                    event_type: "pix_confirmed",
                    payload: p
                });

                // 4. Upgrade de Plano do Usuário
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("plan")
                    .eq("id", payment.user_id)
                    .single();

                console.log(`[vox-webhooks] Fazendo upgrade do usuário ${payment.user_id} para o plano ${payment.plan_slug}`);

                await supabase
                    .from("profiles")
                    .update({ plan: payment.plan_slug })
                    .eq("id", payment.user_id);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[vox-webhooks] Erro:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
