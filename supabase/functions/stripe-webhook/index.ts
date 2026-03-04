import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");

    if (!signature) {
        return new Response("Missing signature", { status: 400 });
    }

    const body = await req.text();
    let event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
            undefined,
            cryptoProvider
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Update profile with subscription ID
            await supabaseAdmin
                .from("profiles")
                .update({ stripe_subscription_id: subscriptionId })
                .eq("stripe_customer_id", customerId);

            // Upsert subscription record
            await upsertSubscription(supabaseAdmin, subscription);
            break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            await upsertSubscription(supabaseAdmin, subscription);
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});

async function upsertSubscription(supabase: any, subscription: Stripe.Subscription) {
    const subscriptionData = {
        id: subscription.id,
        user_id: await getUserIdFromCustomer(supabase, subscription.customer as string),
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        quantity: subscription.items.data[0].quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("subscriptions")
        .upsert(subscriptionData);

    if (error) console.error("Error upserting subscription:", error);
}

async function getUserIdFromCustomer(supabase: any, customerId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

    if (error || !data) {
        console.error("Error finding user for customer:", customerId, error);
        return null;
    }
    return data.id;
}
