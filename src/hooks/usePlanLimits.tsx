import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PlanInfo {
  slug: string;
  name: string;
  priceBrl: number;
  leadLimit: number | null;
  currentLeads: number;
  canCreateLead: boolean;
  agentLimit: number | null;
  loading: boolean;
}

export const usePlanLimits = (): PlanInfo => {
  const { user } = useAuth();
  const [info, setInfo] = useState<PlanInfo>({
    slug: "free",
    name: "Free",
    priceBrl: 0,
    leadLimit: 25,
    currentLeads: 0,
    canCreateLead: true,
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
      const { count } = await supabase
        .from("vox_leads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const leadLimit = (plan as any)?.lead_limit ?? 25;
      const currentLeads = count || 0;

      setInfo({
        slug: planSlug,
        name: (plan as any)?.name || "Free",
        priceBrl: (plan as any)?.price_brl || 0,
        leadLimit,
        currentLeads,
        canCreateLead: leadLimit === null || currentLeads < leadLimit,
        agentLimit: (plan as any)?.agent_limit ?? 1,
        loading: false,
      });
    };

    load();
  }, [user]);

  return info;
};
