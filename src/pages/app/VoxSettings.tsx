import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Save, Copy, ExternalLink, Palette, Bot, Code2,
  Facebook, BarChart3, ShoppingBag, Megaphone, Target,
  Webhook, Braces, MessageSquareCode, Sparkles, Bell, BookOpen,
  TrendingUp, Clock, Users, Sun, Moon, Monitor,
} from "lucide-react";
import { ChatThemeSelector, type ChatTheme } from "@/components/settings/ChatThemeSelector";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { KnowledgeBase } from "@/components/settings/KnowledgeBase";



interface VoxForm {
  webhook_url: string;
  notify_email: string;
  notify_on_new_lead: boolean;
  notify_on_qualified: boolean;
  [key: string]: string | number | boolean | undefined;
}

const VoxSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chatThemeMode, setChatThemeMode] = useState<"whatsapp" | "template" | "custom">("whatsapp");
  const [chatThemeConfig, setChatThemeConfig] = useState<ChatTheme>({
    name: "WhatsApp",
    headerBg: "#00a884",
    headerText: "#ffffff",
    chatBg: "#0b141a",
    userBubbleBg: "#005c4b",
    userBubbleText: "#e9edef",
    aiBubbleBg: "#1f2c34",
    aiBubbleText: "#e9edef",
    inputBg: "#2a3942",
    inputBarBg: "#1a2228",
    fontFamily: "sans-serif",
  });
  const [appearanceMode, setAppearanceMode] = useState<"light" | "dark" | "auto">("dark");
  const [form, setForm] = useState<VoxForm>({
    webhook_url: "",
    notify_email: "",
    notify_on_new_lead: true,
    notify_on_qualified: true,
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("vox_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const d = data as any;
        setForm((prev) => {
          const updated = { ...prev };
          for (const key of Object.keys(prev)) {
            if (d[key] !== undefined && d[key] !== null) {
              updated[key] = d[key];
            }
          }
          return updated;
        });
        setForm((prev) => {
          const updated = { ...prev };
          for (const key of Object.keys(prev)) {
            if (d[key] !== undefined && d[key] !== null) {
              updated[key] = d[key];
            }
          }
          return updated;
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("vox_settings")
      .upsert(
        { user_id: user.id, ...form, updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id" }
      );

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
    }
  };

  const chatUrl = user ? `${window.location.origin}/chat/${user.id}` : "";
  const widgetScriptUrl = user
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-widget?id=${user.id}`
    : "";
  const widgetSnippet = user
    ? `<!-- Chat Vox Chat Widget -->
<script>
(function(){
  var d=document,s=d.createElement('script');
  s.src='${widgetScriptUrl}';
  s.setAttribute('data-vox-id','${user.id}');
  s.setAttribute('data-vox-origin','${window.location.origin}');
  s.async=true;
  d.head.appendChild(s);
})();
</script>`
    : "";

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const update = (key: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white dark:bg-black/20 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 dark:bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-white/70 tracking-tight flex items-center gap-3 mb-2">
            <Bot size={32} className="text-primary dark:drop-shadow-[0_0_15px_rgba(0,255,157,0.5)]" /> Centro de Comando
          </h1>
          <p className="text-[15px] font-medium text-slate-500 dark:text-white/40 max-w-lg">
            Configurações globais de inteligência, design e rastreamento do seu Ecossistema Chat Vox.
          </p>
        </div>
        <div className="relative z-10">
          <Button onClick={handleSave} disabled={saving} className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 text-black shadow-[0_5px_20px_rgba(0,255,157,0.3)] hover:shadow-[0_8px_25px_rgba(0,255,157,0.5)] transition-all font-black gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            SALVAR ALTERAÇÕES
          </Button>
        </div>
      </div>

      {/* Chat Link + Widget Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <Card className="relative bg-white dark:bg-black/40 border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-glass overflow-hidden h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <ExternalLink size={16} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">Link de Acesso Direto</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">PÚBLICO</Badge>
              </div>
              <div className="flex gap-2">
                <Input value={chatUrl} readOnly className="text-xs h-12 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-xl" />
                <Button variant="secondary" size="icon" onClick={() => copyText(chatUrl, "Link")} className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10">
                  <Copy size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-transparent rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <Card className="relative bg-white dark:bg-black/40 border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm dark:shadow-glass overflow-hidden h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Code2 size={16} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">Widget Master Script</p>
                </div>
                <Badge className="bg-blue-500/10 text-blue-500 border-none text-[10px] font-bold">EMBED</Badge>
              </div>
              <div className="flex gap-2">
                <Input value="<script> Centro de Comando Master </script>" readOnly className="text-xs h-12 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-xl font-mono" />
                <Button variant="secondary" size="icon" onClick={() => copyText(widgetSnippet, "Código")} className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10">
                  <Copy size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="knowledge" className="w-full">
        <TabsList className="w-full justify-start bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl flex-wrap h-auto gap-1 border border-slate-200 dark:border-white/5 mb-8">
          <TabsTrigger value="knowledge" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <BookOpen size={14} className="text-primary" /> Cérebro Global
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <Webhook size={14} /> Integrações API
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <Bell size={14} /> Alertas & Email
          </TabsTrigger>
        </TabsList>

        <div className="mt-2 min-h-[400px]">


          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Webhook size={20} />
                  </div>
                  Fluxo de Dados Externos (Webhooks)
                </CardTitle>
                <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/5">EXTERNO</Badge>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Endpoint de Recebimento</Label>
                  <Input
                    value={form.webhook_url as string}
                    onChange={(e) => update("webhook_url", e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                    className="h-14 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-2xl font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground ml-1">Dispare dados para o Zapier, Make, n8n ou seu CRM próprio a cada mensagem.</p>
                </div>

                <div className="bg-black p-6 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Braces size={12} className="text-primary" /> Payload JSON Master
                  </p>
                  <pre className="text-[11px] font-mono text-white/50 whitespace-pre-wrap leading-relaxed">
                    {`{
  "event": "message.received",
  "lead": {
    "id": "uuid",
    "status": "qualificado",
    "score": 75
  },
  "message": { "role": "assistant", "content": "..." }
}`}
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl p-8">
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Email de Destino</Label>
                  <Input
                    value={(form.notify_email as string) || ""}
                    onChange={(e) => update("notify_email", e.target.value)}
                    placeholder="alerta@suaempresa.com"
                    type="email"
                    className="h-14 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-2xl"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Captação de Lead</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Notificar via email quando um novo humano iniciar o chat.</p>
                      </div>
                    </div>
                    <Switch
                      checked={!!form.notify_on_new_lead}
                      onCheckedChange={(v) => update("notify_on_new_lead", v)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Qualificação de Elite</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Alertar apenas quando a IA detectar um lead com score ≥ 60.</p>
                      </div>
                    </div>
                    <Switch
                      checked={!!form.notify_on_qualified}
                      onCheckedChange={(v) => update("notify_on_qualified", v)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-sm dark:shadow-none p-4">
              <div className="bg-primary/5 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-primary/10 mb-6">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen size={20} />
                  </div>
                  Biblioteca de Conhecimento Master
                </h4>
                <p className="text-xs text-slate-500 dark:text-white/40 max-w-2xl font-medium leading-relaxed">
                  Os documentos carregados aqui são o fundamento intelectual de todos os seus agentes. Eles consultarão esta base sempre que não souberem uma resposta específica.
                </p>
              </div>
              <div className="px-2">
                {user && <KnowledgeBase userId={user.id} />}
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <div className="pt-10 flex justify-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Chat Vox OS v2.0 • Secured Data Protocol</p>
      </div>
    </div>
  );
};

export default VoxSettings;
