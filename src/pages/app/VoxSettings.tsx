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
  Webhook, Braces, MessageSquareCode, Sparkles, Bell, BookOpen,
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações do Chat Vox</h1>
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

          <TabsTrigger value="webhooks" className="gap-1.5 text-xs rounded-lg">
            <Webhook size={13} /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs rounded-lg">
            <Bell size={13} /> Notificações
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5 text-xs rounded-lg">
            <BookOpen size={13} /> Base de Conhecimento
          </TabsTrigger>
        </TabsList>

        {/* AI & Prompt Tab */}
        <TabsContent value="ai" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={15} className="text-primary" /> Prompt da IA
              </CardTitle>
              <CardDescription>
                Personalize como sua IA se comporta. Deixe em branco para usar o prompt padrão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">System Prompt (Instruções da IA)</Label>
                <Textarea
                  value={form.system_prompt as string}
                  onChange={(e) => update("system_prompt", e.target.value)}
                  rows={8}
                  placeholder={`Exemplo: Você é a assistente virtual da Clínica XYZ. Seu objetivo é:\n- Tirar dúvidas sobre tratamentos\n- Qualificar o lead perguntando sobre interesse e orçamento\n- Agendar uma avaliação gratuita\n- Sempre responder de forma empática e profissional`}
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Dica: Inclua informações sobre seus serviços, preços e regras de atendimento para a IA responder melhor.
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
                <Input value={form.ai_name as string} onChange={(e) => update("ai_name", e.target.value)} placeholder="Chat Vox" />
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


      </Tabs>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
};

export default VoxSettings;
