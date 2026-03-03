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
        const { plan_slug, user_id } = await req.json();

        if (!plan_slug || !user_id) {
            return new Response(JSON.stringify({ error: "plan_slug and user_id are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch Plan Details
        const { data: plan, error: planError } = await supabase
            .from("plans")
            .select("*")
            .eq("slug", plan_slug)
            .single();

        if (planError || !plan) {
            return new Response(JSON.stringify({ error: "Plan not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Fetch EFI Credentials from system_settings
        const { data: settings } = await supabase
            .from("system_settings")
            .select("key, value")
            .in("key", ["efi_client_id", "efi_client_secret", "efi_certificate_p12", "efi_sandbox"]);

        const clientId = settings?.find(s => s.key === "efi_client_id")?.value;
        const clientSecret = settings?.find(s => s.key === "efi_client_secret")?.value;
        const certificateBase64 = settings?.find(s => s.key === "efi_certificate_p12")?.value;
        const isSandbox = settings?.find(s => s.key === "efi_sandbox")?.value === "true";

        if (!clientId || !clientSecret || !certificateBase64) {
            return new Response(JSON.stringify({ error: "EFI Credentials not configured in Admin" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const baseUrl = isSandbox
            ? "https://pix-h.gerencianet.com.br"
            : "https://pix.gerencianet.com.br";

        // 3. Authenticate with EFI (OAuth mTLS)
        // Note: In a real mTLS scenario with Deno, we need to pass the cert to the fetch client.
        // For this implementation, we will assume the cert is handled or provided via internal proxy if standard fetch limits apply.
        // However, since we are building a NATIVE solution, we will prepare the payload.

        const authHeader = btoa(`${clientId}:${clientSecret}`);

        // mTLS in Deno requires createHttpClient
        // const client = Deno.createHttpClient({ certChain: decodedCert, privateKey: decodedKey });

        // For the sake of this MVP, we will simulate the API call structure.
        // In production, the user would need to ensure the Supabase project has the certificate configured or use a worker.

        console.log(`[vox-payments] Generating Pix for ${plan_slug} - User ${user_id}`);

        // Create Cobrabilidade (Pix Charge)
        // POST /v2/cob
        const cobPayload = {
            calendario: { expiracao: 3600 },
            valor: { original: (plan.price_brl / 100).toFixed(2) },
            chave: "SUA_CHAVE_PIX_AQUI", // This should also be in settings
            solicitacaoPagador: `Upgrade para Plano ${plan.name} - Chat Vox`
        };

        // 4. Create record in vox_payments
        const { data: payment, error: payError } = await supabase
            .from("vox_payments")
            .insert({
                user_id,
                plan_slug,
                amount_cents: plan.price_brl,
                status: "pending",
                metadata: { payload: cobPayload }
            })
            .select()
            .single();

        if (payError) throw payError;

        // Simulation of EFI Response for the Demo/Initial Setup
        const mockPixResponse = {
            txid: "vox_" + Math.random().toString(36).substr(2, 9),
            pixCopiaECola: "00020101021226850014br.gov.bcb.pix0123seu-pix-copia-e-cola-gerado-pela-efi-aqui",
            qrcode_base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" // Mock small image
        };

        // Update with real tracking ID
        await supabase.from("vox_payments").update({
            pix_id: mockPixResponse.txid,
            pix_copiapasta: mockPixResponse.pixCopiaECola,
            pix_qrcode_base64: mockPixResponse.qrcode_base64
        }).eq("id", payment.id);

        return new Response(JSON.stringify({
            payment_id: payment.id,
            qrcode: mockPixResponse.qrcode_base64,
            copiapasta: mockPixResponse.pixCopiaECola,
            amount: plan.price_brl
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[vox-payments] error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
