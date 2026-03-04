import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Bell, Save, Plus, Trash2, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface MetricAlert {
  id: string;
  metric_key: string;
  label: string;
  operator: string;
  threshold: number;
  is_enabled: boolean;
  severity: string;
}

const METRIC_OPTIONS = [
  { value: "conversion_rate", label: "Taxa de Conversão (%)" },
  { value: "leads_today", label: "Leads Hoje" },
  { value: "active_user_pct", label: "% Usuários Ativos" },
  { value: "avg_score", label: "Score Médio" },
  { value: "bot_engagement", label: "Engajamento Bot (%)" },
  { value: "total_leads", label: "Total de Leads" },
  { value: "total_messages", label: "Total de Mensagens" },
  { value: "leads_per_user", label: "Leads por Usuário" },
];

const OPERATOR_LABELS: Record<string, string> = { lt: "Menor que", gt: "Maior que", eq: "Igual a" };
const SEVERITY_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  critical: { icon: AlertTriangle, color: "text-destructive", label: "Crítico" },
  warning: { icon: AlertCircle, color: "text-yellow-500", label: "Atenção" },
  info: { icon: Info, color: "text-blue-500", label: "Info" },
};

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState<MetricAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_metric_alerts" as any)
      .select("*")
      .order("created_at");
    if (data) setAlerts(data as unknown as MetricAlert[]);
    setLoading(false);
  };

  useEffect(() => { loadAlerts(); }, []);

  const updateAlert = (id: string, field: string, value: any) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const alert of alerts) {
      await supabase
        .from("admin_metric_alerts" as any)
        .update({
          label: alert.label,
          operator: alert.operator,
          threshold: alert.threshold,
          is_enabled: alert.is_enabled,
          severity: alert.severity,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", alert.id);
    }
    toast({ title: "Alertas salvos com sucesso" });
    setSaving(false);
  };

  const addAlert = async () => {
    const { data, error } = await supabase
      .from("admin_metric_alerts" as any)
      .insert({
        metric_key: "total_leads",
        label: "Novo alerta",
        operator: "lt",
        threshold: 10,
        severity: "warning",
      } as any)
      .select()
      .single();
    if (data) {
      setAlerts(prev => [...prev, data as unknown as MetricAlert]);
      toast({ title: "Alerta adicionado" });
    } else if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    }
  };

  const deleteAlert = async (id: string) => {
    await supabase.from("admin_metric_alerts" as any).delete().eq("id", id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast({ title: "Alerta removido" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Bell size={22} className="text-primary" /> Alertas de Métricas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure limites para receber alertas visuais no dashboard quando métricas ultrapassarem os valores definidos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addAlert} className="text-xs gap-1.5">
            <Plus size={14} /> Novo Alerta
          </Button>
          <Button size="sm" onClick={saveAll} disabled={saving} className="text-xs gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar Tudo
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
          const SevIcon = sev.icon;
          return (
            <Card key={alert.id} className={`border-border ${!alert.is_enabled ? "opacity-50" : ""}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      checked={alert.is_enabled}
                      onCheckedChange={(v) => updateAlert(alert.id, "is_enabled", v)}
                    />
                    <SevIcon size={18} className={sev.color} />
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Input
                      value={alert.label}
                      onChange={(e) => updateAlert(alert.id, "label", e.target.value)}
                      placeholder="Nome do alerta"
                      className="text-sm"
                    />

                    <Select value={alert.metric_key} onValueChange={(v) => updateAlert(alert.id, "metric_key", v)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METRIC_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={alert.operator} onValueChange={(v) => updateAlert(alert.id, "operator", v)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lt">Menor que</SelectItem>
                        <SelectItem value="gt">Maior que</SelectItem>
                        <SelectItem value="eq">Igual a</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={alert.threshold}
                        onChange={(e) => updateAlert(alert.id, "threshold", Number(e.target.value))}
                        className="text-sm"
                      />
                      <Select value={alert.severity} onValueChange={(v) => updateAlert(alert.id, "severity", v)}>
                        <SelectTrigger className="text-sm w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Crítico</SelectItem>
                          <SelectItem value="warning">Atenção</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => deleteAlert(alert.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <Bell size={24} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum alerta configurado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAlerts;
