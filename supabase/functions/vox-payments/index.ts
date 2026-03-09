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

        // 🛡️ Risco 1: Bloquear pagamento por cartão simulado
        if (method === "card") {
            return new Response(JSON.stringify({
                error: "Pagamento por cartão temporariamente indisponível.",
                details: "Utilize Pix para efetuar o pagamento. O método de cartão estará disponível em breve."
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Buscar plano
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

        // 🛡️ Risco 4: Validar Cupom de forma dinâmica no banco de dados
        let finalPriceCents = plan.price_brl;
        let appliedCoupon: string | null = null;
        let discountApplied = 0;

        if (coupon && typeof coupon === "string") {
            const couponCode = coupon.toUpperCase().trim();

            const { data: couponData, error: couponError } = await supabase
                .from("vox_coupons")
                .select("*")
                .eq("code", couponCode)
                .eq("is_active", true)
                .maybeSingle();

            if (couponError) {
                console.error("[vox-payments] Erro ao buscar cupom:", couponError);
            }

            if (couponData) {
                // Verificar validade
                const isExpired = couponData.expires_at && new Date(couponData.expires_at) < new Date();
                const isMaxedOut = couponData.max_uses !== null && couponData.current_uses >= couponData.max_uses;

                if (isExpired) {
                    return new Response(JSON.stringify({
                        error: "Cupom expirado.",
                        details: `O cupom ${couponCode} não é mais válido.`
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                if (isMaxedOut) {
                    return new Response(JSON.stringify({
                        error: "Cupom esgotado.",
                        details: `O cupom ${couponCode} atingiu o limite de usos.`
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                // Aplicar desconto
                discountApplied = couponData.discount_percentage;
                finalPriceCents = Math.round(plan.price_brl * (1 - discountApplied / 100));
                appliedCoupon = couponCode;

                // Incrementar usos do cupom
                await supabase
                    .from("vox_coupons")
                    .update({ current_uses: (couponData.current_uses || 0) + 1 })
                    .eq("id", couponData.id);

                console.log(`[vox-payments] Cupom ${couponCode} aplicado. ${discountApplied}% desconto. De ${plan.price_brl} para ${finalPriceCents}`);
            } else {
                // Cupom inválido
                return new Response(JSON.stringify({
                    error: "Cupom inválido.",
                    details: `O cupom ${couponCode} não existe ou está inativo.`
                }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

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

        // 3. Fluxo Pix Dinâmico (Cobrança Imediata Efí - quando disponível)
        // Se existir suporte a mTLS no ambiente Deno, o fluxo de Pix Dinâmico é preferido.
        // Por enquanto, mantemos o Pix Estático Bacen como padrão estável de lançamento.
        console.log("[vox-payments] Modo Pix Master Estático Ativado.");

        if (method === "pix") {
            if (!pixKey) throw new Error("Chave Pix não configurada (EFIPAY_PIX_KEY)");

            const txid = `VOX${Date.now()}${(Math.random() * 1000).toFixed(0)}`.toUpperCase();

            // Geração de PIX Estático - PADRÃO BACEN
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
                        original_price: (plan.price_brl / 100).toFixed(2),
                        coupon: appliedCoupon,
                        discount_percentage: discountApplied
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
                discount_applied: discountApplied,
                coupon_applied: appliedCoupon,
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
