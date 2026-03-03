import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface PlanInfo {
  slug: string;
  name: string;
  priceBrl: number;
  leadLimit: number | null;
  currentLeads: number;
  requestLimit: number | null;
  currentRequests: number;
  canCreateLead: boolean;
  canSendMessage: boolean;
  agentLimit: number | null;
  loading: boolean;
}

export const usePlanLimits = (): PlanInfo => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [info, setInfo] = useState<PlanInfo>({
    slug: "free",
    name: "Free",
    priceBrl: 0,
    leadLimit: 25,
    currentLeads: 0,
    requestLimit: 100,
    currentRequests: 0,
    canCreateLead: true,
    canSendMessage: true,
    agentLimit: 1,
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get user's plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      const planSlug = (profile as any)?.plan || "free";

      // Get plan details
      const { data: plan } = await supabase
        .from("plans")
        .select("*")
        .eq("slug", planSlug)
        .single();

      // Count current leads
      const { count: leadCount } = await supabase
        .from("vox_leads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Count current requests (messages)
      const { count: requestCount } = await supabase
        .from("vox_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const leadLimit = isAdmin ? null : ((plan as any)?.lead_limit ?? 25);
      const requestLimit = isAdmin ? null : ((plan as any)?.request_limit ?? 100);
      const currentLeads = leadCount || 0;
      const currentRequests = requestCount || 0;

      setInfo({
        slug: planSlug,
        name: isAdmin ? "Administrator" : ((plan as any)?.name || "Free"),
        priceBrl: (plan as any)?.price_brl || 0,
        leadLimit,
        currentLeads,
        requestLimit,
        currentRequests,
        canCreateLead: leadLimit === null || currentLeads < leadLimit,
        canSendMessage: requestLimit === null || currentRequests < requestLimit,
        agentLimit: (plan as any)?.agent_limit ?? 1,
        loading: false,
      });
    };

    load();
  }, [user, isAdmin]);

  return info;
};
