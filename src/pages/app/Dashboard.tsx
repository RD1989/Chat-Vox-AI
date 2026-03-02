import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Users, UserCheck, MapPin, TrendingUp, MessageSquare, Target, BarChart3, MousePointerClick } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePlanLimits } from "@/hooks/usePlanLimits";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCardsGrid from "@/components/dashboard/StatCardsGrid";
import LeadsChart from "@/components/dashboard/LeadsChart";
import GeoDistribution from "@/components/dashboard/GeoDistribution";
import TopCities from "@/components/dashboard/TopCities";
import RecentLeads from "@/components/dashboard/RecentLeads";
import UtmRoiPanel from "@/components/dashboard/UtmRoiPanel";
import EngagementBySource from "@/components/dashboard/EngagementBySource";
import RoiThermometer from "@/components/dashboard/RoiThermometer";
import TrafficCopilot from "@/components/dashboard/TrafficCopilot";

interface DashboardStats {
  totalLeads: number;
  qualified: number;
  topCity: string;
  conversionRate: string;
  totalMessages: number;
  avgScore: number;
  interactiveMessages: number;
  avgMessagesPerLead: number;
  recentLeads: Array<{
    id: string;
    name: string;
    status: string;
    city: string | null;
    region: string | null;
    created_at: string;
    qualified: boolean;
    qualification_score: number | null;
  }>;
  chartData: Array<{ date: string; leads: number }>;
  geoData: Array<{ state: string; count: number }>;
  cityData: Array<{ city: string; state: string; count: number }>;
  utmRoiData: Array<{ source: string; totalLeads: number; qualifiedLeads: number; conversionRate: string; avgScore: number }>;
  engagementData: Array<{ source: string; avgMessages: number; avgScore: number }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const plan = usePlanLimits();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0, qualified: 0, topCity: "—", conversionRate: "0%",
    totalMessages: 0, avgScore: 0, interactiveMessages: 0, avgMessagesPerLead: 0,
    recentLeads: [], chartData: [], geoData: [], cityData: [],
    utmRoiData: [], engagementData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [{ data: leads }, { count: msgCount }, { data: interactiveMsgs }, { data: allMessages }] = await Promise.all([
        supabase.from("vox_leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vox_messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("vox_messages").select("id", { count: "exact" }).eq("user_id", user.id).eq("message_type", "interactive"),
        supabase.from("vox_messages").select("lead_id").eq("user_id", user.id),
      ]);

      if (leads) {
        const qualified = leads.filter((l) => l.qualified);
        const cities = leads.map((l) => l.city).filter(Boolean);
        const cityCount: Record<string, number> = {};
        cities.forEach((c) => { cityCount[c!] = (cityCount[c!] || 0) + 1; });
        const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

        const scores = leads.map(l => l.qualification_score || 0).filter(s => s > 0);
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        // Geo data by state
        const stateCount: Record<string, number> = {};
        leads.forEach((l) => {
          const region = l.region || "Desconhecido";
          stateCount[region] = (stateCount[region] || 0) + 1;
        });
        const geoData = Object.entries(stateCount)
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        // City data
        const cityStateCount: Record<string, { city: string; state: string; count: number }> = {};
        leads.forEach((l) => {
          const city = l.city || "Desconhecida";
          const state = l.region || "—";
          const key = `${city}-${state}`;
          if (!cityStateCount[key]) cityStateCount[key] = { city, state, count: 0 };
          cityStateCount[key].count += 1;
        });
        const cityData = Object.values(cityStateCount).sort((a, b) => b.count - a.count).slice(0, 10);

        // Chart data (7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
          const day = startOfDay(subDays(new Date(), i));
          const nextDay = startOfDay(subDays(new Date(), i - 1));
          const count = leads.filter(l => {
            const d = new Date(l.created_at);
            return d >= day && d < nextDay;
          }).length;
          chartData.push({ date: format(day, "dd/MM", { locale: ptBR }), leads: count });
        }

        // --- UTM ROI Data ---
        const msgsByLead: Record<string, number> = {};
        (allMessages || []).forEach((m) => {
          msgsByLead[m.lead_id] = (msgsByLead[m.lead_id] || 0) + 1;
        });

        const utmGroups: Record<string, typeof leads> = {};
        leads.forEach((l) => {
          const src = l.utm_source || l.source || null;
          if (src) {
            if (!utmGroups[src]) utmGroups[src] = [];
            utmGroups[src].push(l);
          }
        });

        const utmRoiData = Object.entries(utmGroups)
          .map(([source, groupLeads]) => {
            const qualifiedCount = groupLeads.filter(l => l.qualified).length;
            const groupScores = groupLeads.map(l => l.qualification_score || 0).filter(s => s > 0);
            const avg = groupScores.length ? Math.round(groupScores.reduce((a, b) => a + b, 0) / groupScores.length) : 0;
            return {
              source,
              totalLeads: groupLeads.length,
              qualifiedLeads: qualifiedCount,
              conversionRate: `${groupLeads.length ? Math.round((qualifiedCount / groupLeads.length) * 100) : 0}%`,
              avgScore: avg,
            };
          })
          .sort((a, b) => b.totalLeads - a.totalLeads)
          .slice(0, 10);

        // --- Engagement by Source ---
        const engagementData = Object.entries(utmGroups)
          .map(([source, groupLeads]) => {
            const totalMsgs = groupLeads.reduce((sum, l) => sum + (msgsByLead[l.id] || 0), 0);
            const avgMsgs = groupLeads.length ? Math.round((totalMsgs / groupLeads.length) * 10) / 10 : 0;
            const groupScores = groupLeads.map(l => l.qualification_score || 0).filter(s => s > 0);
            const avg = groupScores.length ? Math.round(groupScores.reduce((a, b) => a + b, 0) / groupScores.length) : 0;
            return { source, avgMessages: avgMsgs, avgScore: avg };
          })
          .sort((a, b) => b.avgMessages - a.avgMessages)
          .slice(0, 8);

        const avgMsgsPerLead = leads.length > 0 && msgCount
          ? Math.round((msgCount / leads.length) * 10) / 10
          : 0;

        setStats({
          totalLeads: leads.length,
          qualified: qualified.length,
          topCity,
          conversionRate: leads.length ? `${Math.round((qualified.length / leads.length) * 100)}%` : "0%",
          totalMessages: msgCount || 0,
          avgScore,
          interactiveMessages: interactiveMsgs?.length || 0,
          avgMessagesPerLead: avgMsgsPerLead,
          recentLeads: leads.slice(0, 8) as any,
          chartData,
          geoData,
          cityData,
          utmRoiData,
          engagementData,
        });
      }
      setLoading(false);
    };

    fetchStats();

    const channel = supabase
      .channel("vox_leads_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vox_leads", filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const statCards = [
    { label: "Total de Leads", value: stats.totalLeads, icon: Users, description: "Leads capturados pelo chat" },
    { label: "Qualificados", value: stats.qualified, icon: UserCheck, description: "Leads com score ≥ 60" },
    { label: "Total de Mensagens", value: stats.totalMessages, icon: MessageSquare, description: "Mensagens trocadas no chat" },
    { label: "Interações com Botões", value: stats.interactiveMessages, icon: MousePointerClick, description: "Respostas via botões e formulários" },
    { label: "Score Médio", value: stats.avgScore, icon: Target, description: "Pontuação média de qualificação" },
    { label: "Msgs por Lead", value: stats.avgMessagesPerLead, icon: BarChart3, description: "Média de mensagens por conversa" },
    { label: "Taxa de Conversão", value: stats.conversionRate, icon: TrendingUp, description: "% de leads qualificados" },
    { label: "Top Cidade", value: stats.topCity, icon: MapPin, description: "Cidade com mais leads" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <DashboardHeader plan={plan} />

      {/* Top Value Section: Stats + ROI Thermometer */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-8">
          <StatCardsGrid cards={statCards} />
        </div>
        <RoiThermometer qualifiedLeads={stats.qualified} avgScore={stats.avgScore} />
      </div>

      {/* Traffic Copilot Row */}
      <TrafficCopilot stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadsChart data={stats.chartData} />
        <GeoDistribution data={stats.geoData} />
      </div>

      {/* UTM ROI + Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UtmRoiPanel data={stats.utmRoiData} />
        <EngagementBySource data={stats.engagementData} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <TopCities data={stats.cityData} />
        <RecentLeads leads={stats.recentLeads} />
      </div>
    </div>
  );
};

export default Dashboard;
