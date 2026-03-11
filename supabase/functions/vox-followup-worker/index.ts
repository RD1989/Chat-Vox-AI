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

        console.log("[followup-worker] Starting check...");

        // 1. Get agents with follow-up enabled
        const { data: activeAgents, error: agentsError } = await supabase
            .from("vox_agents")
            .select("id, user_id, follow_up_config")
            .eq("follow_up_enabled", true);

        if (agentsError) throw agentsError;
        if (!activeAgents || activeAgents.length === 0) {
            return new Response(JSON.stringify({ message: "No active follow-ups to process." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let processedCount = 0;

        for (const agent of activeAgents) {
            const followUpSteps = agent.follow_up_config as any[];
            if (!followUpSteps || followUpSteps.length === 0) continue;

            // 2. Find leads for this agent that are due for follow-up
            // Logic: updated_at (last activity) + delay_hours < now
            // AND current step < followUpSteps.length

            const { data: leads, error: leadsError } = await supabase
                .from("vox_leads")
                .select("id, follow_up_step, updated_at, last_follow_up_sent_at")
                .eq("agent_id", agent.id)
                .neq("status", "Finalizado")
                .lt("follow_up_step", followUpSteps.length);

            if (leadsError) {
                console.error(`Error fetching leads for agent ${agent.id}:`, leadsError);
                continue;
            }

            for (const lead of leads) {
                const currentStepIdx = lead.follow_up_step;
                const currentStep = followUpSteps[currentStepIdx];
                if (!currentStep) continue;

                const lastActivity = new Date(lead.updated_at).getTime();
                const lastFollowUp = lead.last_follow_up_sent_at ? new Date(lead.last_follow_up_sent_at).getTime() : 0;

                // Use the latest between last user activity and last follow-up sent
                const referenceTime = Math.max(lastActivity, lastFollowUp);
                const minutesInactive = (Date.now() - referenceTime) / (1000 * 60); // Em minutos

                // Compatibilidade com cadastros antigos: se tem delay_minutes usa, senão multiplica hours por 60
                const requiredDelay = currentStep.delay_minutes !== undefined ? currentStep.delay_minutes : (currentStep.delay_hours * 60 || 0);

                if (minutesInactive >= requiredDelay) {
                    console.log(`[followup-worker] Sending step ${currentStepIdx + 1} to lead ${lead.id} after ${minutesInactive.toFixed(1)} mins`);

                    // 3. Send message (insert into vox_messages)
                    const { error: msgError } = await supabase
                        .from("vox_messages")
                        .insert({
                            lead_id: lead.id,
                            agent_id: agent.id,
                            user_id: agent.user_id,
                            role: "assistant",
                            content: currentStep.message,
                            message_type: "text",
                            metadata: { is_follow_up: true, step: currentStepIdx + 1 }
                        });

                    if (!msgError) {
                        // 4. Update lead progress
                        await supabase
                            .from("vox_leads")
                            .update({
                                follow_up_step: currentStepIdx + 1,
                                last_follow_up_sent_at: new Date().toISOString()
                            } as any)
                            .eq("id", lead.id);

                        processedCount++;
                    } else {
                        console.error(`Error sending follow-up to lead ${lead.id}:`, msgError);
                    }
                }
            }
        }

        return new Response(JSON.stringify({ message: `Processed ${processedCount} follow-up messages.` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("[followup-worker] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
