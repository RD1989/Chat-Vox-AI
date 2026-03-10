import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    // EFI Webhook requires returning 200 soon to confirm receipt
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Validation using Secret Param via URL Query (e.g. ?secret=MY_LONG_SECRET)
        const url = new URL(req.url);
        const providedSecret = url.searchParams.get("secret");
        const expectedSecret = Deno.env.get("EFIPAY_WEBHOOK_SECRET");

        if (expectedSecret && providedSecret !== expectedSecret) {
            console.error("[vox-pix-webhook] Tentativa não autorizada! Secret inválido fornecido.");
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json();
        await supabase.from("vox_payment_logs").insert({
            event_type: "pix_confirmation",
            payload: body
        });

        // 2. Extract transaction ID from EFI payload
        // The exact path depends on EFI webhook documentation
        // Usually it's in body.pix or body.pix[0]
        const pixData = body.pix?.[0];
        if (pixData && (pixData.txid || pixData.endToEndId)) {
            const txid = pixData.txid;

            // 3. Find the payment in our database
            const { data: payment, error: payError } = await supabase
                .from("vox_payments")
                .select("*")
                .eq("pix_id", txid)
                .eq("status", "pending")
                .maybeSingle();

            if (payment) {
                console.log(`[vox-pix-webhook] Confirming payment ${payment.id} for user ${payment.user_id}`);

                // 4. Update Payment Status
                await supabase
                    .from("vox_payments")
                    .update({ status: "paid", updated_at: new Date().toISOString() })
                    .eq("id", payment.id);

                // 5. Update User Plan in Profiles
                await supabase
                    .from("profiles")
                    .update({
                        plan: payment.plan_slug,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", payment.user_id);

                console.log(`[vox-pix-webhook] SUCCESS: User ${payment.user_id} upgraded to ${payment.plan_slug}`);
            } else {
                console.log(`[vox-pix-webhook] Payment with txid ${txid} not found or already processed.`);
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[vox-pix-webhook] error:", error);
        // Even if error, returning 200 to EFI might be preferred to stop retries if the issue is logic-based
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200, // Return 200 to acknowledge receipt
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
