import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Zap } from "lucide-react";

const AdminSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform_name: "Chat Vox",
    support_email: "",
    max_leads_free: "500",
    maintenance_mode: "false",
    efi_client_id: "",
    efi_client_secret: "",
    efi_certificate_p12: "",
    efi_sandbox: "true",
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

      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="text-primary" size={16} /> Gateway de Pagamento Pix (EFI)
          </CardTitle>
          <CardDescription>Configure suas credenciais da EFI para receber pagamentos via Pix no automático.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client ID</Label>
              <Input
                value={form.efi_client_id}
                onChange={(e) => setForm({ ...form, efi_client_id: e.target.value })}
                placeholder="Ex: Client_Id_..."
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client Secret</Label>
              <Input
                type="password"
                value={form.efi_client_secret}
                onChange={(e) => setForm({ ...form, efi_client_secret: e.target.value })}
                placeholder="••••••••••••••••"
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Certificado .P12 (Base64)</Label>
            <Textarea
              value={form.efi_certificate_p12}
              onChange={(e) => setForm({ ...form, efi_certificate_p12: e.target.value })}
              placeholder="Cole o conteúdo do seu certificado convertido para Base64 aqui..."
              className="font-mono text-[10px] min-h-[100px] bg-white dark:bg-black/20"
            />
            <p className="text-[10px] text-muted-foreground italic">
              * Dica: Use um conversor online de .p12 para Base64 para colar o conteúdo binário como texto aqui.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="efi_sandbox"
              checked={form.efi_sandbox === "true"}
              onChange={(e) => setForm({ ...form, efi_sandbox: e.target.checked ? "true" : "false" })}
              className="accent-primary"
            />
            <Label htmlFor="efi_sandbox" className="text-xs font-bold text-primary cursor-pointer">ATIVAR MODO SANDBOX (TESTE)</Label>
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
