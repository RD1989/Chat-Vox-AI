import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, MessageSquare, UserCheck, Activity, Loader2, Globe,
  TrendingUp, MapPin, MousePointerClick, DollarSign, BarChart3,
  RefreshCw, Target, Zap, Eye, Calendar, AlertTriangle, AlertCircle, Info, Bell,
} from "lucide-react";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

type TimeFilter = "7d" | "30d" | "90d" | "all";
const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
];
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const GEO_COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))",
  "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

interface UserPerformance {
  id: string;
  full_name: string;
  email: string;
  plan: string;
  is_active: boolean;
  leads_count: number;
  qualified_leads: number;
  messages_count: number;
  interactive_messages: number;
  avg_score: number;
  conversion_rate: number;
  top_cities: Array<{ city: string; count: number }>;
  top_regions: Array<{ region: string; count: number }>;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalMessages: number;
  leadsToday: number;
  qualifiedLeads: number;
  conversionRate: string;
  interactiveMessages: number;
  avgScoreGlobal: number;
  newUsersThisWeek: number;
  totalInteractions: number;
  avgLeadsPerUser: string;
  avgMsgsPerUser: string;
  chartData: Array<{ date: string; leads: number; users: number }>;
  geoByState: Array<{ state: string; count: number }>;
  topCities: Array<{ city: string; state: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
  userPerformance: UserPerformance[];
  financials: Array<{
    plan_name: string;
    active_users: number;
    total_revenue: number;
    total_ia_cost: number;
    net_profit: number;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d");
  const [triggeredAlerts, setTriggeredAlerts] = useState<Array<{ label: string; severity: string; metric: string; current: number; threshold: number; operator: string }>>([]);
  const navigate = useNavigate();

  const getFilterDate = (filter: TimeFilter): Date | null => {
    if (filter === "all") return null;
    const days = filter === "7d" ? 7 : filter === "30d" ? 30 : 90;
    return subDays(new Date(), days);
  };

  const filterByDate = <T extends { created_at?: string }>(items: T[], filter: TimeFilter): T[] => {
    const cutoff = getFilterDate(filter);
    if (!cutoff) return items;
    return items.filter(item => item.created_at && isAfter(new Date(item.created_at), cutoff));
  };

  const loadStats = async () => {
    setLoading(true);

    const [usersRes, geoRes] = await Promise.all([
      supabase.functions.invoke("admin-users", {
        body: { action: "list_users" },
      }),
      supabase.functions.invoke("admin-users", {
        body: { action: "get_geo_stats" },
      }),
    ]);

    const usersResData = usersRes.data || { users: [] };
    const geoResData = geoRes.data || { leads: [] };

    if (usersRes.error) console.error("Erro ao buscar usuários admin:", usersRes.error);
    if (geoRes.error) console.error("Erro ao buscar geo stats admin:", geoRes.error);

    const users: UserPerformance[] = usersResData.users || [];
    const allGeoLeads = geoResData.leads || [];
    const geoLeads = filterByDate(allGeoLeads, timeFilter);

    const totalLeads = users.reduce((s, u) => s + u.leads_count, 0);
    const totalMessages = users.reduce((s, u) => s + u.messages_count, 0);
    const totalInteractions = users.reduce((s, u) => s + u.interactive_messages, 0);
    const qualifiedLeads = users.reduce((s, u) => s + u.qualified_leads, 0);
    const activeUsers = users.filter(u => u.is_active).length;

    const today = new Date().toISOString().split("T")[0];
    const leadsToday = allGeoLeads.filter((l: any) => l.created_at?.startsWith(today)).length;

    const scores = geoLeads.map((l: any) => l.qualification_score || 0).filter((s: number) => s > 0);
    const avgScoreGlobal = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

    const weekAgo = subDays(new Date(), 7).toISOString();
    const newUsersThisWeek = users.filter((u: any) => u.created_at >= weekAgo).length;

    // Chart data - adapt range to filter
    const chartDays = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : timeFilter === "90d" ? 90 : 30;
    const chartData = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const nextDay = startOfDay(subDays(new Date(), i - 1));
      const dayStr = day.toISOString();
      const nextDayStr = nextDay.toISOString();
      chartData.push({
        date: format(day, chartDays <= 7 ? "EEE" : "dd/MM", { locale: ptBR }),
        leads: geoLeads.filter((l: any) => l.created_at >= dayStr && l.created_at < nextDayStr).length,
        users: users.filter((u: any) => u.created_at >= dayStr && u.created_at < nextDayStr).length,
      });
    }

    // Geo
    const stateCount: Record<string, number> = {};
    geoLeads.forEach((l: any) => { stateCount[l.region || "Desconhecido"] = (stateCount[l.region || "Desconhecido"] || 0) + 1; });
    const geoByState = Object.entries(stateCount).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const cityMap: Record<string, { city: string; state: string; count: number }> = {};
    geoLeads.forEach((l: any) => {
      const key = `${l.city || "?"}-${l.region || "?"}`;
      if (!cityMap[key]) cityMap[key] = { city: l.city || "?", state: l.region || "?", count: 0 };
      cityMap[key].count++;
    });
    const topCities = Object.values(cityMap).sort((a, b) => b.count - a.count).slice(0, 10);

    // Plans
    const planCount: Record<string, number> = {};
    users.forEach((u: any) => { planCount[u.plan || "free"] = (planCount[u.plan || "free"] || 0) + 1; });
    const planDistribution = Object.entries(planCount).map(([plan, count]) => ({ plan, count }));

    setStats({
      totalUsers: users.length,
      activeUsers,
      totalLeads,
      totalMessages,
      leadsToday,
      qualifiedLeads,
      conversionRate: totalLeads ? `${Math.round((qualifiedLeads / totalLeads) * 100)}%` : "0%",
      interactiveMessages: totalInteractions,
      avgScoreGlobal,
      newUsersThisWeek,
      totalInteractions,
      avgLeadsPerUser: activeUsers ? (totalLeads / activeUsers).toFixed(1) : "0",
      avgMsgsPerUser: activeUsers ? Math.round(totalMessages / activeUsers).toString() : "0",
      chartData,
      geoByState,
      topCities,
      planDistribution,
      userPerformance: users.sort((a, b) => b.leads_count - a.leads_count),
      financials: usersRes.financials || [],
    });

    // Evaluate metric alerts
    const { data: alertConfigs } = await supabase
      .from("admin_metric_alerts" as any)
      .select("*")
      .eq("is_enabled", true);

    if (alertConfigs) {
      const metricValues: Record<string, number> = {
        conversion_rate: totalLeads ? Math.round((qualifiedLeads / totalLeads) * 100) : 0,
        leads_today: leadsToday,
        active_user_pct: users.length ? Math.round((activeUsers / users.length) * 100) : 0,
        avg_score: avgScoreGlobal,
        bot_engagement: totalMessages ? Math.round((totalInteractions / totalMessages) * 100) : 0,
        total_leads: totalLeads,
        total_messages: totalMessages,
        leads_per_user: activeUsers ? parseFloat((totalLeads / activeUsers).toFixed(1)) : 0,
      };

      const fired = (alertConfigs as any[]).filter((a: any) => {
        const val = metricValues[a.metric_key];
        if (val === undefined) return false;
        if (a.operator === "lt") return val < a.threshold;
        if (a.operator === "gt") return val > a.threshold;
        if (a.operator === "eq") return val === a.threshold;
        return false;
      }).map((a: any) => ({
        label: a.label,
        severity: a.severity,
        metric: a.metric_key,
        current: metricValues[a.metric_key],
        threshold: a.threshold,
        operator: a.operator,
      }));

      setTriggeredAlerts(fired);
    }

    setLoading(false);
  };

  useEffect(() => { loadStats(); }, [timeFilter]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const statCards = [
    { label: "Usuários Totais", value: stats.totalUsers, icon: Users, desc: "Contas registradas" },
    { label: "Usuários Ativos", value: stats.activeUsers, icon: UserCheck, desc: "Contas habilitadas" },
    { label: "Novos (7 dias)", value: stats.newUsersThisWeek, icon: RefreshCw, desc: "Registros recentes" },
    { label: "Total de Leads", value: stats.totalLeads, icon: Activity, desc: "Leads globais" },
    { label: "Leads Hoje", value: stats.leadsToday, icon: TrendingUp, desc: "Últimas 24h" },
    { label: "Qualificados", value: stats.qualifiedLeads, icon: Target, desc: "Score ≥ 60" },
    { label: "Mensagens IA", value: stats.totalMessages, icon: MessageSquare, desc: "Total trocadas" },
    { label: "Interações Bot", value: stats.totalInteractions, icon: MousePointerClick, desc: "Botões + formulários" },
    { label: "Score Médio", value: stats.avgScoreGlobal, icon: BarChart3, desc: "Qualificação global" },
    { label: "Conversão", value: stats.conversionRate, icon: DollarSign, desc: "% qualificados" },
    { label: "Leads/Usuário", value: stats.avgLeadsPerUser, icon: Zap, desc: "Média por conta" },
    { label: "Msgs/Usuário", value: stats.avgMsgsPerUser, icon: MessageSquare, desc: "Média por conta" },
  ];

  const totalMRR = stats.financials.reduce((sum, f) => sum + f.total_revenue, 0);
  const totalIACost = stats.financials.reduce((sum, f) => sum + f.total_ia_cost, 0);
  const globalMargin = totalMRR > 0 ? `${Math.round(((totalMRR - totalIACost) / totalMRR) * 100)}%` : "0%";

  const financialCards = [
    { label: "Receita (MRR)", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMRR), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Custo IA Est.", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIACost), icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Lucro Líquido", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMRR - totalIACost), icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Margem Global", value: globalMargin, icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão completa: desempenho da plataforma, métricas por usuário, geolocalização e interações do bot.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Calendar size={14} className="text-muted-foreground ml-2 mr-1" />
            {TIME_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={timeFilter === opt.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeFilter(opt.value)}
                className="text-xs h-7 px-3"
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <button onClick={loadStats} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-2">
          {triggeredAlerts.map((alert, i) => {
            const isC = alert.severity === "critical";
            const isW = alert.severity === "warning";
            const Icon = isC ? AlertTriangle : isW ? AlertCircle : Info;
            const bg = isC ? "bg-destructive/10 border-destructive/30" : isW ? "bg-yellow-500/10 border-yellow-500/30" : "bg-blue-500/10 border-blue-500/30";
            const textColor = isC ? "text-destructive" : isW ? "text-yellow-600" : "text-blue-600";
            const opLabel = alert.operator === "lt" ? "<" : alert.operator === "gt" ? ">" : "=";
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bg}`}>
                <Icon size={18} className={textColor} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${textColor}`}>{alert.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Valor atual: <strong>{alert.current}</strong> — Limite: {opLabel} {alert.threshold}
                  </p>
                </div>
                <Badge variant={isC ? "destructive" : "secondary"} className="text-[10px]">
                  {isC ? "Crítico" : isW ? "Atenção" : "Info"}
                </Badge>
              </div>
            );
          })}
          <button onClick={() => navigate("/admin/alerts")} className="text-xs text-primary hover:underline">
            Configurar alertas →
          </button>
        </div>
      )}
      {/* Financial Overview (Master Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((card) => (
          <Card key={card.label} className="border-border/60 bg-gradient-to-br from-card to-background shadow-sm overflow-hidden relative group">
            <div className={`absolute -right-2 -bottom-2 opacity-5 scale-150 transition-transform group-hover:scale-[1.7]`}>
              <card.icon size={80} />
            </div>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                  <card.icon size={16} className={card.color} />
                </div>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{card.label}</span>
              </div>
              <p className="text-2xl font-black text-foreground">{card.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Métrica em tempo real</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <card.icon size={14} className="text-primary" />
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide truncate">{card.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Activity size={16} className="text-primary" /> Atividade — {TIME_OPTIONS.find(o => o.value === timeFilter)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads" />
                  <Bar dataKey="users" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Usuários" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Globe size={16} className="text-primary" /> Geolocalização por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {stats.geoByState.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-40 h-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.geoByState} dataKey="count" nameKey="state" cx="50%" cy="50%" innerRadius={30} outerRadius={65} paddingAngle={2}>
                        {stats.geoByState.map((_, i) => (<Cell key={i} fill={GEO_COLORS[i % GEO_COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {stats.geoByState.map((item, i) => (
                    <div key={item.state} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: GEO_COLORS[i % GEO_COLORS.length] }} />
                      <span className="text-sm text-foreground flex-1 truncate">{item.state}</span>
                      <span className="text-sm font-semibold text-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Globe size={28} className="text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Dados geográficos aparecerão aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Performance Table */}
      <Card className="border-border bg-card">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Desempenho por Usuário
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Leads, mensagens, interações com botões e taxa de conversão de cada usuário da plataforma.
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usuário</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plano</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Leads</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qualif.</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Msgs</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interações Bot</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversão</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {stats.userPerformance.map((u) => (
                  <>
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-foreground">{u.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{u.plan}</Badge>
                      </td>
                      <td className="text-center py-3 px-2 font-bold text-foreground">{u.leads_count}</td>
                      <td className="text-center py-3 px-2 font-bold text-foreground">{u.qualified_leads}</td>
                      <td className="text-center py-3 px-2 font-bold text-foreground">{u.messages_count}</td>
                      <td className="text-center py-3 px-2">
                        <span className="font-bold text-foreground">{u.interactive_messages}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-bold ${u.avg_score >= 60 ? "text-primary" : "text-muted-foreground"}`}>
                          {u.avg_score}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-bold ${u.conversion_rate >= 50 ? "text-primary" : "text-muted-foreground"}`}>
                          {u.conversion_rate}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant={u.is_active ? "default" : "secondary"} className="text-[10px]">
                          {u.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <button
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                    {expandedUser === u.id && (
                      <tr key={`${u.id}-detail`} className="bg-secondary/30">
                        <td colSpan={10} className="px-4 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                <MapPin size={12} className="inline mr-1" /> Top Cidades
                              </p>
                              {u.top_cities.length > 0 ? (
                                <div className="space-y-1">
                                  {u.top_cities.map((c) => (
                                    <div key={c.city} className="flex items-center justify-between text-sm">
                                      <span className="text-foreground">{c.city}</span>
                                      <span className="font-semibold text-foreground">{c.count} leads</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sem dados de cidades</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                <Globe size={12} className="inline mr-1" /> Top Estados
                              </p>
                              {u.top_regions.length > 0 ? (
                                <div className="space-y-1">
                                  {u.top_regions.map((r) => (
                                    <div key={r.region} className="flex items-center justify-between text-sm">
                                      <span className="text-foreground">{r.region}</span>
                                      <span className="font-semibold text-foreground">{r.count} leads</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sem dados de estados</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {stats.userPerformance.length === 0 && (
            <div className="text-center py-10">
              <Users size={24} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom: Cities + Plans + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Top Cidades
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {stats.topCities.length > 0 ? (
              <div className="space-y-2">
                {stats.topCities.slice(0, 8).map((item, i) => {
                  const pct = Math.round((item.count / (stats.topCities[0]?.count || 1)) * 100);
                  return (
                    <div key={`${item.city}-${item.state}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground truncate">{item.city} <span className="text-muted-foreground text-xs">({item.state})</span></span>
                        <span className="font-semibold text-foreground ml-2">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GEO_COLORS[i % GEO_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign size={16} className="text-primary" /> Distribuição de Planos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {stats.planDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.planDistribution.map((item) => {
                  const pct = stats.totalUsers ? Math.round((item.count / stats.totalUsers) * 100) : 0;
                  return (
                    <div key={item.plan} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs capitalize">{item.plan}</Badge>
                        <span className="text-sm font-semibold text-foreground">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" /> KPIs da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {[
              { label: "Taxa de Retenção", value: stats.totalUsers ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%` : "0%" },
              { label: "Leads por Usuário", value: stats.avgLeadsPerUser },
              { label: "Msgs por Usuário", value: stats.avgMsgsPerUser },
              { label: "Engajamento Bot", value: stats.totalMessages ? `${Math.round((stats.interactiveMessages / stats.totalMessages) * 100)}%` : "0%" },
              { label: "Crescimento Semanal", value: `+${stats.newUsersThisWeek}` },
            ].map((kpi) => (
              <div key={kpi.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <span className="text-lg font-bold text-foreground">{kpi.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
