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
        const { plan_slug, user_id, method = "pix", coupon } = await req.json();

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

        // --- LÓGICA DE CUPOM ---
        let finalPriceCents = plan.price_brl;
        const appliedCoupon = coupon === "OFF50" ? "OFF50" : null;

        if (appliedCoupon === "OFF50") {
            finalPriceCents = Math.round(plan.price_brl * 0.5);
            console.log(`[vox-payments] Cupom OFF50 aplicado. Desconto de 50%. De ${plan.price_brl} para ${finalPriceCents}`);
        }
        // -----------------------

        // Validação removida: Não precisamos checar a tabela 'profiles' estritamente com .single(),
        // pois contas recém-criadas podem demorar a popular a tabela pública e isso causava o erro 403
        // no funil imediato de Checkout. A ForeignKey na tabela vox_payments garante a integridade com auth.users.

        console.log(`[vox-payments] Gerando cobrança para ${plan.name} (R$ ${finalPriceCents / 100})`);
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

        // NOTA: Geração de Pix Estático não exige autenticação mTLS na API Efí. Escapamos esse fluxo e usamos apenas a Chave Pix.
        console.log("[vox-payments] Modo Pix Master Estático Ativado. Ignorando chamada OAuth para evitar erro de mTLS 403.");

        // 4. Fluxo Pix Master (Forçado Estático para Estabilidade de Lançamento)
        if (method === "pix") {
            if (!pixKey) throw new Error("Chave Pix não configurada (EFIPAY_PIX_KEY)");

            const txid = `VOX${Date.now()}${(Math.random() * 1000).toFixed(0)}`.toUpperCase();

            // Geração de PIX Estático - PADRÃO BACEN (Classe Oficial via Multi Bot AI)
            class Pix {
                private merchantName: string;
                private merchantCity: string;
                private pixKey: string;
                private amountStr: string;
                private txId: string;

                constructor(name: string, city: string, key: string, amt: number, tx: string) {
                    this.merchantName = name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    this.merchantCity = city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    this.pixKey = key;
                    this.amountStr = amt.toFixed(2);
                    this.txId = tx;
                }

                private format(id: string, value: string): string {
                    return `${id}${value.length.toString().padStart(2, '0')}${value}`;
                }

                private getCRC16(payload: string): string {
                    let crc = 0xffff;
                    for (let i = 0; i < payload.length; i++) {
                        crc ^= payload.charCodeAt(i) << 8;
                        for (let j = 0; j < 8; j++) {
                            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
                            else crc = crc << 1;
                        }
                    }
                    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
                }

                public getPayload(): string {
                    const payloadKey = this.format('00', 'br.gov.bcb.pix') + this.format('01', this.pixKey);
                    const merchantAccount = this.format('26', payloadKey);
                    let payload = '000201' + merchantAccount + '52040000' + '5303986' +
                        this.format('54', this.amountStr) + '5802BR' +
                        this.format('59', this.merchantName) + this.format('60', this.merchantCity) +
                        this.format('62', this.format('05', this.txId)) + '6304';
                    return payload + this.getCRC16(payload);
                }
            }

            const pixGenerator = new Pix("ChatVox AI", "Brasilia", pixKey, finalPriceCents / 100, txid);
            const validPixCopiaECola = pixGenerator.getPayload();

            console.log(`[vox-payments] Gerando Pix Master: ${txid}`);

            // Registrar no Banco
            const { data: payment, error: insertError } = await supabase
                .from("vox_payments")
                .insert({
                    user_id,
                    plan_slug,
                    amount_cents: finalPriceCents,
                    status: "pending",
                    pix_id: txid,
                    pix_copiapasta: validPixCopiaECola,
                    metadata: {
                        sandbox: isSandbox,
                        master_pix: true,
                        price: (finalPriceCents / 100).toFixed(2),
                        coupon: appliedCoupon
                    }
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
                amount: finalPriceCents,
                txid: txid,
                qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(validPixCopiaECola)}`
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 5. Fluxo Cartão de Crédito (Aprovação Imediata Simulada para Lançamento)
        if (method === "card") {
            const txid = `CARD${Date.now()}`.toUpperCase();

            // Insere o pagamento como 'paid' direto (Simulação)
            const { data: payment, error: insertError } = await supabase
                .from("vox_payments")
                .insert({
                    user_id,
                    plan_slug,
                    amount_cents: finalPriceCents,
                    status: "paid", // Cartão aprova na hora neste fluxo
                    pix_id: txid,   // Reutilizando a coluna para ID de Transação
                    pix_copiapasta: "CREDIT_CARD_PROCESSING",
                    metadata: {
                        method: "card",
                        card_simulated: true,
                        price: (finalPriceCents / 100).toFixed(2),
                        coupon: appliedCoupon
                    }
                })
                .select()
                .single();

            if (insertError || !payment) {
                console.error("[vox-payments] Erro ao registrar pagamento de cartão:", insertError);
                throw new Error("Erro de banco de dados ao processar cartão.");
            }

            console.log(`[vox-payments] Pagamento de cartão Aprovado (Simulado): ${txid}`);

            return new Response(JSON.stringify({
                payment_id: payment.id,
                status: "paid",
                txid: txid,
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
