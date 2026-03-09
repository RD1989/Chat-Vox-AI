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
  TrendingUp, Clock, Users,
} from "lucide-react";
import { ChatThemeSelector, type ChatTheme } from "@/components/settings/ChatThemeSelector";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { KnowledgeBase } from "@/components/settings/KnowledgeBase";



interface VoxForm {
  ai_name: string;
  ai_avatar_url: string;
  primary_color: string;
  welcome_message: string;
  system_prompt: string;
  webhook_url: string;
  custom_css: string;
  widget_trigger_seconds: number;
  widget_trigger_scroll: number;
  widget_position: string;
  [key: string]: string | number;
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
  const [form, setForm] = useState<VoxForm>({
    ai_name: "Chat Vox",
    ai_avatar_url: "",
    primary_color: "#6366f1",
    welcome_message: "Olá! Como posso ajudar você hoje?",
    system_prompt: "",
    webhook_url: "",
    custom_css: "",
    widget_trigger_seconds: 5,
    widget_trigger_scroll: 50,
    widget_position: "bottom-right",
    notify_email: "",
    notify_on_new_lead: 1,
    notify_on_qualified: 1,
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
        // Restore theme mode & config
        if (d.chat_theme) setChatThemeMode(d.chat_theme as any);
        if (d.chat_theme_config && typeof d.chat_theme_config === "object" && d.chat_theme_config.name) {
          setChatThemeConfig(d.chat_theme_config as ChatTheme);
        }
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
        { user_id: user.id, ...form, chat_theme: chatThemeMode, chat_theme_config: chatThemeConfig, updated_at: new Date().toISOString() } as any,
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

  const update = (key: string, value: string | number) =>
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

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="w-full justify-start bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl flex-wrap h-auto gap-1 border border-slate-200 dark:border-white/5 mb-8">
          <TabsTrigger value="ai" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <Sparkles size={14} className="text-primary" /> IA & Prompt
          </TabsTrigger>
          <TabsTrigger value="identity" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <Bot size={14} /> Identidade
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <Palette size={14} /> Aparência
          </TabsTrigger>
          <TabsTrigger value="widget" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <MessageSquareCode size={14} /> Posicionamento
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <Webhook size={14} /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <Bell size={14} /> Alertas
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2 text-[11px] font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:shadow-sm px-4 h-10 transition-all">
            <BookOpen size={14} /> Base Master
          </TabsTrigger>
        </TabsList>

        <div className="mt-2 min-h-[400px]">
          {/* AI & Prompt Tab */}
          <TabsContent value="ai" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl shadow-sm dark:shadow-none overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 p-6">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles size={20} />
                  </div>
                  Motor de Inteligência Global
                </CardTitle>
                <CardDescription className="text-[13px] ml-13">
                  Estas instruções serão herdadas por todos os agentes que não possuírem um prompt específico. Defina as regras mestras da sua operação.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">System Prompt (Diretrizes Master)</Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <Textarea
                      value={form.system_prompt as string}
                      onChange={(e) => update("system_prompt", e.target.value)}
                      rows={12}
                      placeholder={`Exemplo: Você é o cérebro central da empresa Alpha. Suas diretrizes fundamentais são:\n1. Sempre seja cordial...\n2. Colete leads qualificados...\n3. Use gatilhos mentais de escassez...`}
                      className="relative bg-slate-50/80 border-slate-200 text-slate-800 dark:bg-black/60 dark:border-white/10 dark:text-primary/90 font-mono rounded-2xl focus:ring-primary/20 focus:border-primary/50 text-[13px] leading-relaxed p-6 transition-all"
                    />
                  </div>
                  <div className="flex items-start gap-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <Target size={16} className="text-primary mt-0.5" />
                    <p className="text-[11px] text-slate-600 dark:text-white/50 leading-relaxed font-medium">
                      <strong>Dica Pro:</strong> Use este espaço para definir o tom de voz padrão da marca e as restrições éticas de todos os bots.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Identity Tab */}
          <TabsContent value="identity" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl shadow-sm dark:shadow-none p-6">
              <CardContent className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Assinatura do Bot (Nome)</Label>
                    <Input
                      value={form.ai_name as string}
                      onChange={(e) => update("ai_name", e.target.value)}
                      placeholder="Chat Vox"
                      className="h-14 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl focus:ring-primary/20 focus:border-primary/50 transition-all font-bold text-lg"
                    />
                  </div>
                  {user && (
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Avatar Global</Label>
                      <AvatarUpload
                        userId={user.id}
                        currentUrl={form.ai_avatar_url as string}
                        onUrlChange={(url) => update("ai_avatar_url", url)}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Boas-vindas Padrão</Label>
                  <Textarea
                    value={form.welcome_message as string}
                    onChange={(e) => update("welcome_message", e.target.value)}
                    rows={4}
                    className="bg-slate-50/50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-2xl focus:ring-primary/20 focus:border-primary/50 text-sm p-5 transition-all leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl p-6 h-full">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg">Configurador Estético</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <ChatThemeSelector
                    activeMode={chatThemeMode}
                    onModeChange={setChatThemeMode}
                    themeConfig={chatThemeConfig}
                    onThemeChange={setChatThemeConfig}
                    primaryColor={form.primary_color as string}
                    aiName={form.ai_name as string}
                    aiAvatarUrl={form.ai_avatar_url as string}
                  />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm">Paleta de Marca</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-3 items-center bg-slate-50 dark:bg-black/40 p-3 rounded-2xl border border-slate-200 dark:border-white/10">
                        <input
                          type="color"
                          value={form.primary_color as string}
                          onChange={(e) => update("primary_color", e.target.value)}
                          className="w-12 h-10 rounded-xl border border-slate-200 dark:border-white/20 cursor-pointer overflow-hidden p-0 bg-transparent"
                        />
                        <Input value={form.primary_color as string} onChange={(e) => update("primary_color", e.target.value)} className="w-full bg-transparent border-none text-sm font-mono font-bold" />
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden flex">
                        <div className="flex-1 bg-primary"></div>
                        <div className="flex-1 bg-primary/60"></div>
                        <div className="flex-1 bg-primary/30"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Code2 size={16} className="text-blue-500" /> Overwrite CSS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <Textarea
                      value={form.custom_css as string}
                      onChange={(e) => update("custom_css", e.target.value)}
                      rows={6}
                      placeholder=".chatvox-bubble { ... }"
                      className="font-mono text-[11px] bg-black/60 dark:border-white/10 dark:text-blue-400 p-4 rounded-xl"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Widget Tab */}
          <TabsContent value="widget" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-white dark:bg-transparent border-slate-200 dark:border-white/5 rounded-3xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Clock size={20} />
                    </div>
                    <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Temporizador de Conversão</Label>
                  </div>
                  <Input
                    type="number"
                    value={form.widget_trigger_seconds}
                    onChange={(e) => update("widget_trigger_seconds", parseInt(e.target.value) || 0)}
                    className="h-16 text-center text-2xl font-black bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-3xl"
                  />
                  <p className="text-xs text-center text-muted-foreground font-medium">Segundos até o widget abrir sozinho (0 = off)</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <TrendingUp size={20} />
                    </div>
                    <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Intenção por Scroll (%)</Label>
                  </div>
                  <Input
                    type="number"
                    value={form.widget_trigger_scroll}
                    onChange={(e) => update("widget_trigger_scroll", parseInt(e.target.value) || 0)}
                    className="h-16 text-center text-2xl font-black bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-3xl"
                  />
                  <p className="text-xs text-center text-muted-foreground font-medium">Porcentagem de leitura da página para abrir (0 = off)</p>
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-white/5">
                <Label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Ancoragem do Widget</Label>
                <div className="flex gap-4">
                  {[
                    { id: "bottom-right", label: "Inferior Direito", icon: "👉" },
                    { id: "bottom-left", label: "Inferior Esquerdo", icon: "👈" }
                  ].map((pos) => (
                    <Button
                      key={pos.id}
                      variant={form.widget_position === pos.id ? "default" : "outline"}
                      size="lg"
                      onClick={() => update("widget_position", pos.id)}
                      className={`flex-1 rounded-[1.5rem] h-16 font-bold border-2 transition-all ${form.widget_position === pos.id ? "bg-primary text-black border-primary shadow-[0_5px_20px_rgba(0,255,157,0.3)]" : "dark:bg-black/40 dark:border-white/5"}`}
                    >
                      <span className="mr-3 text-2xl">{pos.icon}</span> {pos.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

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
                      onCheckedChange={(v) => update("notify_on_new_lead", v ? 1 : 0)}
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
                      onCheckedChange={(v) => update("notify_on_qualified", v ? 1 : 0)}
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
