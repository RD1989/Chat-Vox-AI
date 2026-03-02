import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

const AdminSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform_name: "Chat Vox",
    support_email: "",
    max_leads_free: "500",
    maintenance_mode: "false",
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", Object.keys(form));

      if (data) {
        const updated = { ...form };
        data.forEach((r) => {
          if (r.key in updated && r.value) {
            (updated as any)[r.key] = r.value;
          }
        });
        setForm(updated);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    for (const [key, value] of Object.entries(form)) {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          { key, value, updated_at: new Date().toISOString(), updated_by: user.id } as any,
          { onConflict: "key" }
        );
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast({ title: "Configurações salvas!" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">Configurações globais da plataforma.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Geral</CardTitle>
          <CardDescription>Configurações básicas da plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Nome da Plataforma</Label>
            <Input
              value={form.platform_name}
              onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Email de Suporte</Label>
            <Input
              type="email"
              value={form.support_email}
              onChange={(e) => setForm({ ...form, support_email: e.target.value })}
              placeholder="suporte@seudominio.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Limite de Leads (Plano Free)</Label>
            <Input
              type="number"
              value={form.max_leads_free}
              onChange={(e) => setForm({ ...form, max_leads_free: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
        Salvar
      </Button>
    </div>
  );
};

export default AdminSettings;
