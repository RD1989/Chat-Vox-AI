import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Clock, MapPin, TrendingUp, Users, Target, Zap } from "lucide-react";
import { format, subDays, startOfDay, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(199, 89%, 48%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 50%)",
  "hsl(280, 65%, 60%)",
];

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: l }, { data: m }] = await Promise.all([
        supabase.from("vox_leads").select("*").eq("user_id", user.id),
        supabase.from("vox_messages").select("*").eq("user_id", user.id),
      ]);
      setLeads(l || []);
      setMessages(m || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  // --- Data calculations ---
  const qualified = leads.filter((l) => l.qualified);
  const today = startOfDay(new Date());

  // Leads per day (last 14 days)
  const dailyData = [];
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const nextDay = startOfDay(subDays(new Date(), i - 1));
    const count = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= day && d < nextDay;
    }).length;
    dailyData.push({ date: format(day, "dd/MM", { locale: ptBR }), leads: count });
  }

  // Heatmap: leads by hour of day
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    leads: leads.filter((l) => getHours(new Date(l.created_at)) === h).length,
  }));

  // Funnel: novo → qualificado → em_atendimento → venda
  const funnelStages = [
    { name: "Total", value: leads.length },
    { name: "Qualificados", value: leads.filter((l) => l.qualified || l.status === "qualificado").length },
    { name: "Em Atendimento", value: leads.filter((l) => l.status === "em_atendimento").length },
    { name: "Vendas", value: leads.filter((l) => l.status === "venda").length },
  ];

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    const src = l.source || l.utm_source || "Direto";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // City breakdown
  const cityMap: Record<string, number> = {};
  leads.forEach((l) => {
    if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1;
  });
  const cityData = Object.entries(cityMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Key metrics
  const avgScore = leads.length
    ? Math.round(leads.reduce((a, l) => a + (l.qualification_score || 0), 0) / leads.length)
    : 0;
  const avgMsgsPerLead = leads.length
    ? Math.round(messages.length / leads.length)
    : 0;
  const convRate = leads.length
    ? `${Math.round((qualified.length / leads.length) * 100)}%`
    : "0%";
  const todayLeads = leads.filter((l) => new Date(l.created_at) >= today).length;

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Métricas detalhadas do seu funil de leads.</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Leads Hoje", value: todayLeads, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
          { label: "Taxa Conversão", value: convRate, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Score Médio", value: avgScore, icon: Target, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Msgs/Lead", value: avgMsgsPerLead, icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
                <m.icon size={15} className={m.color} />
              </div>
              <p className="text-xl font-bold text-foreground">{m.value}</p>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{m.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads over time */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp size={14} className="text-muted-foreground" /> Leads (14 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#ag)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap by hour */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" /> Leads por Hora do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" interval={2} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users size={14} className="text-muted-foreground" /> Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelStages.map((stage, i) => {
                const pct = leads.length ? Math.round((stage.value / leads.length) * 100) : 0;
                return (
                  <div key={stage.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{stage.name}</span>
                      <span className="text-xs text-muted-foreground">{stage.value} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct || 1}%`, backgroundColor: COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Source */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target size={14} className="text-muted-foreground" /> Origem dos Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {sourceData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados de origem</p>
            )}
          </CardContent>
        </Card>

        {/* Cities */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin size={14} className="text-muted-foreground" /> Top Cidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cityData.length > 0 ? (
              <div className="space-y-2">
                {cityData.map((city, i) => (
                  <div key={city.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs font-medium text-foreground">{city.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px]">{city.value}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados de cidade</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
