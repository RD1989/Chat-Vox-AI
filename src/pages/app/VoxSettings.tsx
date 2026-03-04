import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Save, Copy, ExternalLink, Palette, Bot, Code2,
  Facebook, BarChart3, ShoppingBag, Megaphone, Target,
  Webhook, Braces, MessageSquareCode, Sparkles, Bell, BookOpen, Volume2,
  Brain, MessageCircle, ShieldAlert, Zap, UserCheck,
} from "lucide-react";
import VoiceSettings from "@/components/settings/VoiceSettings";
import { ChatThemeSelector, type ChatTheme } from "@/components/settings/ChatThemeSelector";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { KnowledgeBase } from "@/components/settings/KnowledgeBase";

const PIXEL_PLATFORMS = [
  { key: "meta_pixel", label: "Meta (Facebook)", icon: Facebook, placeholder: "ID do Pixel Meta", color: "text-blue-500" },
  { key: "tiktok_pixel", label: "TikTok", icon: Megaphone, placeholder: "ID do Pixel TikTok", color: "text-foreground" },
  { key: "google_ads", label: "Google Ads", icon: BarChart3, placeholder: "AW-XXXXXXXXX", color: "text-amber-500" },
  { key: "google_analytics", label: "Google Analytics", icon: BarChart3, placeholder: "G-XXXXXXXXX", color: "text-green-500" },
  { key: "hotmart_pixel", label: "Hotmart", icon: ShoppingBag, placeholder: "ID do Pixel Hotmart", color: "text-orange-500" },
  { key: "kiwify_pixel", label: "Kiwify", icon: ShoppingBag, placeholder: "ID do Pixel Kiwify", color: "text-purple-500" },
  { key: "eduzz_pixel", label: "Eduzz", icon: ShoppingBag, placeholder: "ID do Pixel Eduzz", color: "text-blue-600" },
  { key: "monetizze_pixel", label: "Monetizze", icon: ShoppingBag, placeholder: "ID do Pixel Monetizze", color: "text-green-600" },
  { key: "braip_pixel", label: "Braip", icon: ShoppingBag, placeholder: "ID do Pixel Braip", color: "text-cyan-500" },
  { key: "perfectpay_pixel", label: "Perfect Pay", icon: ShoppingBag, placeholder: "ID do Pixel Perfect Pay", color: "text-indigo-500" },
  { key: "ticto_pixel", label: "Ticto", icon: ShoppingBag, placeholder: "ID do Pixel Ticto", color: "text-rose-500" },
  { key: "greenn_pixel", label: "Greenn", icon: ShoppingBag, placeholder: "ID do Pixel Greenn", color: "text-emerald-500" },
  { key: "kwai_pixel", label: "Kwai", icon: Target, placeholder: "ID do Pixel Kwai", color: "text-orange-400" },
  { key: "taboola_pixel", label: "Taboola", icon: Target, placeholder: "ID do Pixel Taboola", color: "text-blue-400" },
];

interface VoxForm {
  ai_name: string;
  ai_avatar_url: string;
  primary_color: string;
  welcome_message: string;
  system_prompt: string;
  ai_persona: string;
  ai_tone: string;
  ai_objective: string;
  ai_restrictions: string;
  ai_cta: string;
  ai_qualification_question: string;
  webhook_url: string;
  custom_css: string;
  widget_trigger_seconds: number;
  widget_trigger_scroll: number;
  widget_position: string;
  voice_enabled: number;
  voice_response_pct: number;
  voice_name: string;
  voice_speed: number;
  voice_show_text: number;
  voice_accent: string;
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
    ai_name: "ChatVox",
    ai_avatar_url: "",
    primary_color: "#6366f1",
    welcome_message: "Olá! Como posso ajudar você hoje?",
    system_prompt: "",
    ai_persona: "",
    ai_tone: "profissional",
    ai_objective: "",
    ai_restrictions: "",
    ai_cta: "",
    ai_qualification_question: "",
    webhook_url: "",
    custom_css: "",
    widget_trigger_seconds: 5,
    widget_trigger_scroll: 50,
    widget_position: "bottom-right",
    meta_pixel: "",
    tiktok_pixel: "",
    google_ads: "",
    google_analytics: "",
    hotmart_pixel: "",
    kiwify_pixel: "",
    eduzz_pixel: "",
    monetizze_pixel: "",
    braip_pixel: "",
    perfectpay_pixel: "",
    ticto_pixel: "",
    greenn_pixel: "",
    kwai_pixel: "",
    taboola_pixel: "",
    notify_email: "",
    notify_on_new_lead: 1,
    notify_on_qualified: 1,
    voice_enabled: 0,
    voice_response_pct: 50,
    voice_name: "alloy",
    voice_speed: 1.0,
    voice_show_text: 1,
    voice_accent: "pt-BR",
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
    ? `<!-- ChatVox Chat Widget -->
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações do ChatVox</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize seu chat, IA, rastreamento e integrações.</p>
      </div>

      {/* Chat Link + Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink size={14} className="text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Link do Chat</p>
            </div>
            <div className="flex gap-2">
              <Input value={chatUrl} readOnly className="text-xs h-8 bg-background/50" />
              <Button variant="outline" size="icon" onClick={() => copyText(chatUrl, "Link")} className="h-8 w-8 shrink-0">
                <Copy size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Braces size={14} className="text-muted-foreground" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Widget Embed</p>
            </div>
            <div className="flex gap-2">
              <Input value="<script> ... </script>" readOnly className="text-xs h-8 bg-background/50 font-mono" />
              <Button variant="outline" size="icon" onClick={() => copyText(widgetSnippet, "Código")} className="h-8 w-8 shrink-0">
                <Copy size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="w-full justify-start bg-accent/30 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="ai" className="gap-1.5 text-xs rounded-lg">
            <Sparkles size={13} /> IA & Prompt
          </TabsTrigger>
          <TabsTrigger value="identity" className="gap-1.5 text-xs rounded-lg">
            <Bot size={13} /> Identidade
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs rounded-lg">
            <Palette size={13} /> Aparência
          </TabsTrigger>
          <TabsTrigger value="widget" className="gap-1.5 text-xs rounded-lg">
            <MessageSquareCode size={13} /> Widget
          </TabsTrigger>
          <TabsTrigger value="pixels" className="gap-1.5 text-xs rounded-lg">
            <Code2 size={13} /> Pixels
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5 text-xs rounded-lg">
            <Webhook size={13} /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs rounded-lg">
            <Bell size={13} /> Notificações
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5 text-xs rounded-lg">
            <BookOpen size={13} /> Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5 text-xs rounded-lg">
            <Volume2 size={13} /> Voz
          </TabsTrigger>
        </TabsList>

        {/* AI & Prompt Tab — Cérebro Premium */}
        <TabsContent value="ai" className="mt-6 space-y-4">
          {/* Persona & Tom */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain size={15} className="text-primary" /> Persona & Tom de Voz
              </CardTitle>
              <CardDescription>
                Defina quem é sua IA e como ela se comunica. Isso define a personalidade em todas as conversas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Persona (Quem é a IA?)</Label>
                <Textarea
                  value={form.ai_persona as string}
                  onChange={(e) => update("ai_persona", e.target.value)}
                  rows={3}
                  placeholder="Ex: Você é a Ana, consultora especializada em estética facial da Clínica Beleza Pura. Tem 5 anos de experiência e adora ajudar clientes a encontrar o tratamento ideal."
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Dê um nome, uma história e uma especialidade para sua IA. Quanto mais detalhes, mais natural ela fica.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Tom de Voz</Label>
                <div className="flex flex-wrap gap-2">
                  {["profissional", "amigável", "descontraído", "formal", "persuasivo", "empático", "técnico", "divertido"].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => update("ai_tone", tone)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${form.ai_tone === tone
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                        }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objetivo & CTA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap size={15} className="text-primary" /> Objetivo & Conversão
              </CardTitle>
              <CardDescription>
                O que sua IA deve conquistar em cada conversa? Defina o objetivo e a ação desejada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Objetivo Principal</Label>
                <Textarea
                  value={form.ai_objective as string}
                  onChange={(e) => update("ai_objective", e.target.value)}
                  rows={3}
                  placeholder="Ex: Qualificar o lead perguntando sobre orçamento e necessidade, e agendar uma avaliação gratuita na clínica."
                  className="text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">CTA (Chamada para Ação)</Label>
                <Textarea
                  value={form.ai_cta as string}
                  onChange={(e) => update("ai_cta", e.target.value)}
                  rows={2}
                  placeholder="Ex: Ao final da conversa, sempre pergunte: 'Posso agendar sua avaliação gratuita para esta semana?'"
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  O CTA é a ação final que a IA tentará executar em cada conversa.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <UserCheck size={12} /> Pergunta de Qualificação
                </Label>
                <Textarea
                  value={form.ai_qualification_question as string}
                  onChange={(e) => update("ai_qualification_question", e.target.value)}
                  rows={2}
                  placeholder="Ex: 'Qual seu orçamento disponível para investir nesse tratamento?'"
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  A IA fará essa pergunta naturalmente durante a conversa para qualificar o lead.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Restrições */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert size={15} className="text-destructive" /> Restrições & Limites
              </CardTitle>
              <CardDescription>
                O que a IA NÃO deve fazer? Defina limites claros para evitar respostas inadequadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Restrições</Label>
                <Textarea
                  value={form.ai_restrictions as string}
                  onChange={(e) => update("ai_restrictions", e.target.value)}
                  rows={4}
                  placeholder={`Ex:\n- Nunca fale mal da concorrência\n- Não invente preços que não estão na base de conhecimento\n- Não faça diagnósticos médicos\n- Se não souber, diga que vai verificar com a equipe`}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt (Avançado) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={15} className="text-muted-foreground" /> System Prompt (Avançado)
              </CardTitle>
              <CardDescription>
                Para usuários avançados. Se preenchido, será adicionado junto com os campos acima.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Prompt Customizado</Label>
                <Textarea
                  value={form.system_prompt as string}
                  onChange={(e) => update("system_prompt", e.target.value)}
                  rows={6}
                  placeholder="Instruções adicionais em formato livre (opcional)..."
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Este campo é concatenado com os campos acima. Use para instruções específicas que não se encaixam nos outros campos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Identity Tab */}
        <TabsContent value="identity" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Identidade da IA</CardTitle>
              <CardDescription>Nome, avatar e mensagem de boas-vindas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Nome da IA</Label>
                <Input value={form.ai_name as string} onChange={(e) => update("ai_name", e.target.value)} placeholder="ChatVox" />
              </div>
              {user && (
                <AvatarUpload
                  userId={user.id}
                  currentUrl={form.ai_avatar_url as string}
                  onUrlChange={(url) => update("ai_avatar_url", url)}
                />
              )}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Mensagem de Boas-Vindas</Label>
                <Textarea value={form.welcome_message as string} onChange={(e) => update("welcome_message", e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tema do Chat</CardTitle>
              <CardDescription>Escolha o visual do seu chat entre WhatsApp, templates prontos ou totalmente customizado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cor Principal & CSS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Cor Principal</Label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={form.primary_color as string}
                    onChange={(e) => update("primary_color", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <Input value={form.primary_color as string} onChange={(e) => update("primary_color", e.target.value)} className="w-36" />
                  <div className="w-32 h-10 rounded-lg" style={{ backgroundColor: form.primary_color as string }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">CSS Customizado (Avançado)</Label>
                <Textarea
                  value={form.custom_css as string}
                  onChange={(e) => update("custom_css", e.target.value)}
                  rows={4}
                  placeholder=".chatvox-widget { border-radius: 20px; }"
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widget Tab */}
        <TabsContent value="widget" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuração do Widget</CardTitle>
              <CardDescription>Configure o comportamento do popup flutuante.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Abrir após (segundos)</Label>
                  <Input
                    type="number"
                    value={form.widget_trigger_seconds}
                    onChange={(e) => update("widget_trigger_seconds", parseInt(e.target.value) || 0)}
                    min={0}
                    max={120}
                  />
                  <p className="text-[10px] text-muted-foreground">0 = não abrir automaticamente</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Abrir ao scrollar (%)</Label>
                  <Input
                    type="number"
                    value={form.widget_trigger_scroll}
                    onChange={(e) => update("widget_trigger_scroll", parseInt(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                  <p className="text-[10px] text-muted-foreground">0 = desativado</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Posição do Widget</Label>
                <div className="flex gap-2">
                  {["bottom-right", "bottom-left"].map((pos) => (
                    <Button
                      key={pos}
                      variant={form.widget_position === pos ? "default" : "outline"}
                      size="sm"
                      onClick={() => update("widget_position", pos)}
                      className="text-xs"
                    >
                      {pos === "bottom-right" ? "Inferior Direito" : "Inferior Esquerdo"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Embed code */}
              <div className="space-y-2 pt-4 border-t border-border/50">
                <Label className="text-xs font-semibold text-muted-foreground">Código para Incorporar</Label>
                <div className="bg-accent/30 rounded-lg p-3 font-mono text-[11px] text-foreground/80 whitespace-pre-wrap break-all">
                  {widgetSnippet}
                </div>
                <Button variant="outline" size="sm" onClick={() => copyText(widgetSnippet, "Código")} className="text-xs">
                  <Copy size={12} className="mr-1.5" /> Copiar Código
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pixels Tab */}
        <TabsContent value="pixels" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pixels & Tracking</CardTitle>
              <CardDescription>Rastreamento de todas as plataformas de infoprodutos e tráfego pago.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PIXEL_PLATFORMS.map((p) => (
                  <div key={p.key} className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <p.icon size={13} className={p.color} />
                      {p.label}
                    </Label>
                    <Input
                      value={(form[p.key] as string) || ""}
                      onChange={(e) => update(p.key, e.target.value)}
                      placeholder={p.placeholder}
                      className="h-9 text-xs"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Webhook size={15} className="text-primary" /> Webhook
              </CardTitle>
              <CardDescription>
                Receba notificações em tempo real quando novos leads e mensagens chegarem. Compatível com Zapier, Make, n8n.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">URL do Webhook</Label>
                <Input
                  value={form.webhook_url as string}
                  onChange={(e) => update("webhook_url", e.target.value)}
                  placeholder="https://hooks.zapier.com/... ou https://hook.us1.make.com/..."
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  A cada mensagem, enviaremos um POST com dados do lead e mensagem.
                </p>
              </div>
              <div className="bg-accent/30 rounded-lg p-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Payload Exemplo</p>
                <pre className="text-[10px] font-mono text-foreground/70 whitespace-pre-wrap">
                  {`{
  "event": "message.received",
  "lead": {
    "id": "uuid",
    "name": "João",
    "phone": "11999999999",
    "status": "qualificado",
    "qualification_score": 75
  },
  "message": {
    "role": "assistant",
    "content": "Olá! Como posso ajudar?"
  },
  "timestamp": "2026-02-27T12:00:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell size={15} className="text-primary" /> Notificações
              </CardTitle>
              <CardDescription>
                Configure alertas para acompanhar seus leads em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Email para Notificações</Label>
                <Input
                  value={(form.notify_email as string) || ""}
                  onChange={(e) => update("notify_email", e.target.value)}
                  placeholder="seu@email.com"
                  type="email"
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Deixe em branco para desativar notificações por email.
                </p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Novo Lead Capturado</p>
                  <p className="text-[10px] text-muted-foreground">Notificar quando um novo lead iniciar o chat</p>
                </div>
                <Switch
                  checked={!!form.notify_on_new_lead}
                  onCheckedChange={(v) => update("notify_on_new_lead", v ? 1 : 0)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Lead Qualificado</p>
                  <p className="text-[10px] text-muted-foreground">Notificar quando a IA qualificar um lead (score ≥60)</p>
                </div>
                <Switch
                  checked={!!form.notify_on_qualified}
                  onCheckedChange={(v) => update("notify_on_qualified", v ? 1 : 0)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen size={15} className="text-primary" /> Base de Conhecimento
              </CardTitle>
              <CardDescription>
                Adicione informações sobre seu negócio (serviços, preços, FAQ) que a IA usará para responder melhor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && <KnowledgeBase userId={user.id} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="mt-6">
          <VoiceSettings
            voiceEnabled={!!form.voice_enabled}
            voiceResponsePct={form.voice_response_pct as number}
            voiceName={form.voice_name as string}
            voiceSpeed={form.voice_speed as number}
            voiceShowText={!!form.voice_show_text}
            voiceAccent={form.voice_accent as string}
            onUpdate={(key, value) => {
              if (typeof value === "boolean") {
                update(key, value ? 1 : 0);
              } else {
                update(key, value);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
};

export default VoxSettings;
