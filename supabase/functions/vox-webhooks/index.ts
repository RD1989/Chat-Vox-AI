import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🎣 Endpoint de Webhook para receber notificações de pagamento da Efí
// Ativa automaticamente o plano do usuário após confirmação do Pix Dinâmico.

const corsHeaders = {
    "Content-Type": "application/json",
};

serve(async (req) => {
    // Supabase e Efí enviam POST para este endpoint
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json();
        console.log("[vox-webhooks] Payload recebido:", JSON.stringify(body));

        // ─── Estrutura de Notificação da Efí para Pix ───
        // A Efí envia: { pix: [ { txid, endToEndId, valor, pagador } ] }
        if (body.pix && Array.isArray(body.pix)) {
            for (const pixEvent of body.pix) {
                const { txid, endToEndId, valor } = pixEvent;

                if (!txid) {
                    console.warn("[vox-webhooks] Evento sem txid, ignorando.");
                    continue;
                }

                console.log(`[vox-webhooks] Processando Pix confirmado: TXID=${txid}, valor=${valor}`);

                // 1. Buscar pagamento pendente com este txid
                const { data: payment, error: paymentError } = await supabase
                    .from("vox_payments")
                    .select("*")
                    .eq("pix_id", txid)
                    .eq("status", "pending")
                    .maybeSingle();

                if (paymentError || !payment) {
                    console.warn(`[vox-webhooks] Pagamento não encontrado para TXID: ${txid}`);
                    continue;
                }

                // 2. Verificar se o valor pago confere (tolerância de R$ 0,01)
                const amountPaid = parseFloat(valor || "0") * 100; // converter para centavos
                const amountExpected = payment.amount_cents;
                if (Math.abs(amountPaid - amountExpected) > 1) {
                    console.error(`[vox-webhooks] Valor divergente! Pago: ${amountPaid}, Esperado: ${amountExpected}. TXID: ${txid}`);
                    // Registrar divergência mas não ativar
                    await supabase.from("vox_payment_logs").insert({
                        payment_id: payment.id,
                        event_type: "amount_mismatch",
                        payload: body,
                    }).catch(console.error);
                    continue;
                }

                // 3. Marcar pagamento como pago
                await supabase
                    .from("vox_payments")
                    .update({
                        status: "paid",
                        metadata: {
                            ...payment.metadata,
                            end_to_end_id: endToEndId,
                            confirmed_at: new Date().toISOString(),
                        }
                    })
                    .eq("id", payment.id);

                // 4. Ativar plano do usuário
                const planSlug = payment.plan_slug;
                const userId = payment.user_id;

                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        plan: planSlug,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);

                if (profileError) {
                    console.error(`[vox-webhooks] Erro ao ativar plano para user ${userId}:`, profileError);
                } else {
                    console.log(`[vox-webhooks] ✅ Plano '${planSlug}' ativado para usuário ${userId}`);
                }

                // 5. Registrar log de sucesso
                await supabase.from("vox_payment_logs").insert({
                    payment_id: payment.id,
                    event_type: "pix_confirmed",
                    payload: { txid, endToEndId, valor, plan_activated: planSlug },
                }).catch(console.error);
            }
        }

        // Retornar 200 para a Efí confirmar que recebemos a notificação
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: corsHeaders,
        });

    } catch (error: any) {
        console.error("[vox-webhooks] Erro fatal:", error.message);
        // Retornar 200 mesmo com erro para evitar reenvios infinitos da Efí
        return new Response(JSON.stringify({ received: true, error: error.message }), {
            status: 200,
            headers: corsHeaders,
        });
    }
});
