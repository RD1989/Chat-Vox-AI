import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Bot, Plus, Trash2, Copy, ExternalLink, Loader2, Save, Pencil, Power, Eye, EyeOff,
  MessageSquare, Users, Sparkles, Lock, Link as LinkIcon, AlertTriangle, Target, Mic,
  Facebook, Megaphone, BarChart3, ShoppingBag, Code2, Clock, RefreshCcw,
  DollarSign, TrendingUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingWizard } from "@/components/agents/OnboardingWizard";
import { KnowledgeBase } from "@/components/settings/KnowledgeBase";
import { BookOpen, Link as LinkIcon2 } from "lucide-react";
import { AgentButtonsManager } from "@/components/agents/AgentButtonsManager";

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  welcome_message: string;
  ai_avatar_url: string | null;
  primary_color: string;
  is_active: boolean;
  created_at: string;
  chat_theme_config?: any;
  openrouter_model?: string;
  vision_model?: string;
  chat_appearance_mode?: "light" | "dark" | "auto";
  follow_up_enabled?: boolean;
  follow_up_config?: { id: number; delay_hours: number; message: string; }[];
  widget_trigger_seconds?: number;
  widget_trigger_scroll?: number;
  widget_position?: string;
  avg_conversion_value?: number;
}

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

interface ParsedPrompt {
  voice_tone: string;
  priorities: string;
  restrictions: string;
  base_prompt: string;
}

const parseSystemPrompt = (prompt: string): ParsedPrompt => {
  const parseSection = (tag: string) => {
    const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'i');
    const match = prompt.match(regex);
    return match ? match[1].trim() : '';
  };
  return {
    voice_tone: parseSection('TONE'),
    priorities: parseSection('PRIORITIES'),
    restrictions: parseSection('RESTRICTIONS'),
    base_prompt: parseSection('BASE_PROMPT') || prompt.replace(/\[(TONE|PRIORITIES|RESTRICTIONS|BASE_PROMPT)\][\s\S]*?\[\/\1\]/gi, '').trim()
  };
};

const buildSystemPrompt = (parsed: ParsedPrompt): string => {
  let finalPrompt = '';
  if (parsed.base_prompt) finalPrompt += `[BASE_PROMPT]\n${parsed.base_prompt}\n[/BASE_PROMPT]`;
  if (parsed.voice_tone) finalPrompt += `\n\n[TONE]\n${parsed.voice_tone}\n[/TONE]`;
  if (parsed.priorities) finalPrompt += `\n\n[PRIORITIES]\n${parsed.priorities}\n[/PRIORITIES]`;
  if (parsed.restrictions) finalPrompt += `\n\n[RESTRICTIONS]\n${parsed.restrictions}\n[/RESTRICTIONS]`;
  return finalPrompt.trim();
};

const Agents = () => {
  const { user } = useAuth();
  const planInfo = usePlanLimits();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [agentConfig, setAgentConfig] = useState<ParsedPrompt>({ voice_tone: "", priorities: "", restrictions: "", base_prompt: "" });
  const [pixelsConfig, setPixelsConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);

  const openEditModal = (agent: Agent) => {
    setEditAgent(agent);
    setAgentConfig(parseSystemPrompt(agent.system_prompt || "Você é um assistente virtual útil de vendas."));
    setPixelsConfig(agent.chat_theme_config?.pixels || {});
    setEditAgent({
      ...agent,
      avg_conversion_value: agent.avg_conversion_value || 0
    });
  };

  const fetchAgents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vox_agents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    if (data) setAgents(data as unknown as Agent[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const agentLimit = planInfo.loading ? null : (planInfo as any).agentLimit;
  const canCreate = agentLimit === null || agents.length < (agentLimit ?? 1);

  const [wizardOpen, setWizardOpen] = useState(false);

  const handleCreate = async (generatedPrompt?: string, suggestedName?: string) => {
    if (!user || !canCreate) return;
    setCreating(true);

    const finalName = suggestedName || `Assistente ${agents.length + 1}`;
    const finalPrompt = generatedPrompt || "";

    const { data, error } = await supabase
      .from("vox_agents")
      .insert({
        user_id: user.id,
        name: finalName,
        system_prompt: finalPrompt,
        welcome_message: "Olá! Como posso ajudar você hoje?",
        primary_color: "#00FF9D"
      } as any)
      .select()
      .single();

    setCreating(false);
    if (error) {
      toast({ title: "Erro ao criar agente", description: error.message, variant: "destructive" });
    } else if (data) {
      setAgents(prev => [...prev, data as unknown as Agent]);
      openEditModal(data as unknown as Agent);
      toast({ title: generatedPrompt ? "Agente treinado e gerado com sucesso!" : "Agente criado!" });
    }
  };

  const handleSave = async () => {
    if (!editAgent) return;
    setSaving(true);

    const updatedPrompt = buildSystemPrompt(agentConfig);
    const newChatThemeConfig = {
      ...(editAgent.chat_theme_config || {}),
      pixels: pixelsConfig
    };
    const updatedAgent = { ...editAgent, system_prompt: updatedPrompt, chat_theme_config: newChatThemeConfig };

    const { error } = await supabase
      .from("vox_agents")
      .update({
        name: updatedAgent.name,
        system_prompt: updatedAgent.system_prompt,
        welcome_message: updatedAgent.welcome_message,
        primary_color: updatedAgent.primary_color,
        is_active: updatedAgent.is_active,
        chat_theme_config: updatedAgent.chat_theme_config,
        openrouter_model: updatedAgent.openrouter_model,
        vision_model: updatedAgent.vision_model,
        follow_up_enabled: editAgent.follow_up_enabled,
        follow_up_config: editAgent.follow_up_config,
        widget_trigger_seconds: editAgent.widget_trigger_seconds,
        widget_trigger_scroll: editAgent.widget_trigger_scroll,
        widget_position: editAgent.widget_position,
        avg_conversion_value: editAgent.avg_conversion_value
      } as any)
      .eq("id", editAgent.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      setAgents(prev => prev.map(a => a.id === editAgent.id ? updatedAgent : a));
      setEditAgent(null);
      toast({ title: "Alterações confirmadas!" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("vox_agents").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      setAgents(prev => prev.filter(a => a.id !== deleteTarget.id));
      toast({ title: "Agente excluído com sucesso." });
    }
    setDeleteTarget(null);
  };

  const toggleActive = async (agent: Agent) => {
    const newVal = !agent.is_active;
    await supabase.from("vox_agents").update({ is_active: newVal } as any).eq("id", agent.id);
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, is_active: newVal } : a));
  };

  const copyLink = (agentId: string) => {
    const url = `${window.location.origin}/chat/${user?.id}?agent=${agentId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link público de Chat copiado!" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-white/10 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white dark:bg-black/20 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-white/70 tracking-tight flex items-center gap-3 mb-2">
            <Bot size={28} className="text-primary dark:drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]" /> Agentes Multi-IA
          </h1>
          <p className="text-[15px] font-medium text-slate-500 dark:text-white/40 max-w-lg">
            Implante atendentes virtuais ilimitados para diferentes canais. Cada IA possui contexto, objetivo e design únicos.
          </p>
        </div>
        <div className="relative z-10 flex flex-col items-end gap-3">
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:border-white/10 px-3 py-1 text-xs">
            <Users size={12} className="mr-1.5" />
            Uso: {agents.length}/{agentLimit ?? "Ilimitado"}
          </Badge>
          <Button
            onClick={() => setWizardOpen(true)}
            disabled={!canCreate || creating}
            className="rounded-xl bg-primary hover:bg-primary/90 text-black shadow-[0_0_15px_rgba(0,255,157,0.4)] hover:shadow-[0_0_20px_rgba(0,255,157,0.6)] transition-all font-bold gap-2 px-6"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
            NOVO COLABORADOR IA
          </Button>
        </div>
      </div>

      <OnboardingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={(prompt, name) => handleCreate(prompt, name)}
      />

      {!canCreate && (
        <Card className="bg-amber-50 border-warning/30 dark:bg-warning/10 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-warning/20 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-amber-600 dark:text-warning" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-amber-900 dark:text-white tracking-wide">Plano Restrito</p>
              <p className="text-[13px] text-amber-700 dark:text-white/60">
                Seu plano <strong>{planInfo.name}</strong> permite criar apenas {agentLimit} agente(s).
              </p>
            </div>
            <Button className="ml-auto shrink-0 font-bold bg-amber-600 text-white hover:bg-amber-700 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-sm" onClick={() => window.location.href = "/pricing"}>
              Fazer Upgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {agents.length === 0 ? (
        <Card className="bg-white dark:bg-transparent border border-slate-200 dark:border-white/5 min-h-[40vh] flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-primary/10 flex items-center justify-center mb-6 shadow-sm dark:shadow-[0_0_30px_rgba(0,255,157,0.15)] border border-emerald-100 dark:border-primary/20">
            <Sparkles size={32} className="text-emerald-500 dark:text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Equipe Inteligente Vazia</h3>
          <p className="text-[15px] font-medium text-slate-500 dark:text-white/40 max-w-lg mb-8">
            Nenhum atendente IA foi provisionado. Crie agentes especialistas em Vendas, Suporte ou Onboarding num instante.
          </p>
          <Button onClick={() => setWizardOpen(true)} disabled={creating} className="rounded-xl h-12 px-8 font-bold bg-primary text-black hover:bg-primary/90 shadow-md">
            {creating ? <Loader2 size={18} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
            Criar Primeiro Agente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className={`bg-white dark:bg-black/20 border relative overflow-hidden group transition-all duration-500 hover:border-slate-300 dark:hover:border-white/20 shadow-sm dark:shadow-glass ${agent.is_active ? "border-primary/40 shadow border-2 dark:border-1 dark:border-primary/30 dark:shadow-[0_4px_30px_rgba(0,255,157,0.05)]" : "border-slate-200 dark:border-white/5 opacity-80 grayscale hover:opacity-100 hover:grayscale-0"}`}>
                  <div className="absolute top-0 w-full h-1" style={{ backgroundColor: agent.primary_color }}></div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md border border-black/10 dark:border-white/20"
                          style={{ backgroundColor: agent.primary_color, boxShadow: `0 0 20px ${agent.primary_color}40` }}
                        >
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{agent.name}</h3>
                          <Badge variant="outline" className={`mt-1 text-[10px] uppercase font-bold border-transparent ${agent.is_active ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40'}`}>
                            {agent.is_active ? "Status Operacional" : "Offline"}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={() => toggleActive(agent)}
                        className="data-[state=checked]:bg-primary shadow-sm dark:shadow-[0_0_10px_rgba(0,255,157,0.3)]"
                      />
                    </div>

                    <div className="bg-slate-50 dark:bg-black/40 rounded-xl p-3 mb-5 border border-slate-200 dark:border-white/5">
                      <p className="text-[12px] font-medium text-slate-600 dark:text-white/50 line-clamp-3 leading-relaxed min-h-[3.3rem]">
                        <span className="text-primary font-bold dark:font-mono opacity-80 dark:opacity-60">{"/>"} PROMPT: </span>
                        {agent.system_prompt || "Comportamento genérico. Configure o system prompt master deste agente."}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white font-bold border-none dark:border-solid dark:border dark:border-white/10 rounded-lg text-xs h-9 gap-2 shadow-sm dark:shadow-none" onClick={() => openEditModal(agent)}>
                        <Pencil size={13} /> Editar Modelo
                      </Button>
                      <Button variant="secondary" className="w-10 h-9 p-0 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white border-none dark:border-solid dark:border dark:border-white/10 rounded-lg tooltip shadow-sm dark:shadow-none" title="Copiar Link" onClick={() => copyLink(agent.id)}>
                        <LinkIcon size={14} />
                      </Button>
                      <Button variant="secondary" className="w-10 h-9 p-0 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white border-none dark:border-solid dark:border dark:border-white/10 rounded-lg tooltip shadow-sm dark:shadow-none" title="Visualizar ChatBot" onClick={() => window.open(`/chat/${user?.id}?agent=${agent.id}`, "_blank")}>
                        <ExternalLink size={14} />
                      </Button>
                      <Button variant="secondary" className="w-10 h-9 p-0 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-500 border-none dark:border-solid dark:border dark:border-red-500/20 rounded-lg tooltip shadow-sm dark:shadow-none" title="Demitir Agente" onClick={() => setDeleteTarget(agent)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modern Edit Dialog */}
      <Dialog open={!!editAgent} onOpenChange={(open) => !open && setEditAgent(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0a0f16] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-primary/20 flex items-center justify-center border border-emerald-100 dark:border-primary/30">
                <Bot size={18} className="text-emerald-600 dark:text-primary" />
              </div>
              Módulo de Personalidade IA
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-white/40 mt-1 pl-11">
              Forneça as diretrizes paramétricas e o contexto operacional que a IA deve respeitar.
            </DialogDescription>
          </div>

          {editAgent && (
            <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <Tabs defaultValue="behavior" className="w-full">
                <TabsList className="w-full justify-start bg-slate-100 dark:bg-black/40 p-1 mb-6 rounded-xl border border-slate-200 dark:border-white/5">
                  <TabsTrigger value="behavior" className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm px-4">
                    <Bot size={14} /> Comportamento
                  </TabsTrigger>
                  <TabsTrigger value="pixels" className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm px-4">
                    <Code2 size={14} /> Integrações & Pixels
                  </TabsTrigger>
                  <TabsTrigger value="followup" className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm px-4">
                    <RefreshCcw size={14} /> Follow-up
                  </TabsTrigger>
                  <TabsTrigger value="widget" className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm px-4">
                    <MessageSquare size={14} /> Widget & Gatilhos
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm px-4">
                    <BookOpen size={14} /> Conhecimento
                  </TabsTrigger>
                  <TabsTrigger value="links" className="rounded-lg text-xs font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm px-4 text-primary">
                    <LinkIcon2 size={14} /> Links de Conversão
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="behavior" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1">Callsign (Nome)</Label>
                      <Input
                        value={editAgent.name}
                        onChange={e => setEditAgent({ ...editAgent, name: e.target.value })}
                        placeholder="Ex: Especialista Jurídico..."
                        className="h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1">Cor UI (Tema)</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editAgent.primary_color}
                          onChange={e => setEditAgent({ ...editAgent, primary_color: e.target.value })}
                          className="w-12 h-12 rounded-xl border border-slate-200 dark:border-white/20 cursor-pointer overflow-hidden p-0"
                        />
                        <span className="text-xs font-mono text-slate-500 dark:text-white/40 font-bold">{editAgent.primary_color.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1 flex items-center gap-2">
                      Mensagem Receptiva <MessageSquare size={12} className="opacity-50" />
                    </Label>
                    <Textarea
                      value={editAgent.welcome_message}
                      onChange={e => setEditAgent({ ...editAgent, welcome_message: e.target.value })}
                      rows={2}
                      className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-xl focus:border-primary/50 text-sm p-4"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1 flex items-center gap-2">
                        Tom de Voz (Comportamento) <Mic size={12} className="opacity-50" />
                      </Label>
                      <Select
                        value={agentConfig.voice_tone}
                        onValueChange={(val) => setAgentConfig({ ...agentConfig, voice_tone: val })}
                      >
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-xl focus:ring-primary/50 focus:border-primary/50 h-11">
                          <SelectValue placeholder="Selecione a personalidade do atendente..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#0a0f16] border-slate-200 dark:border-white/10 rounded-xl shadow-2xl">
                          <SelectItem value="Profissional e Respeitoso">Profissional e Respeitoso</SelectItem>
                          <SelectItem value="Amigável e Empático">Amigável e Empático</SelectItem>
                          <SelectItem value="Direto e Focado em Conversão">Direto e Focado em Conversão (Vendas)</SelectItem>
                          <SelectItem value="Técnico e Analítico">Técnico e Analítico</SelectItem>
                          <SelectItem value="Descontraído e Humorístico">Descontraído e Jovem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1 flex items-center gap-2">
                          Prioridades <Target size={12} className="opacity-50" />
                        </Label>
                        <Textarea
                          value={agentConfig.priorities}
                          onChange={e => setAgentConfig({ ...agentConfig, priorities: e.target.value })}
                          placeholder="- Obter email do lead&#10;- Agendar reunião"
                          className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-xl focus:border-primary/50 text-sm p-4 min-h-[100px] placeholder:text-slate-400 dark:placeholder:text-white/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-red-500/80 uppercase tracking-widest ml-1 flex items-center gap-2">
                          Restrições <AlertTriangle size={12} className="opacity-50 text-red-500" />
                        </Label>
                        <Textarea
                          value={agentConfig.restrictions}
                          onChange={e => setAgentConfig({ ...agentConfig, restrictions: e.target.value })}
                          placeholder="- Não oferecer descontos&#10;- Não falar sobre política"
                          className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-red-500/20 dark:text-white rounded-xl focus:border-red-500/50 text-sm p-4 min-h-[100px] placeholder:text-slate-400 dark:placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1 flex items-center gap-2">
                        Instruções Base (Opcional) <Bot size={12} className="opacity-50" />
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={agentConfig.base_prompt}
                          onChange={e => setAgentConfig({ ...agentConfig, base_prompt: e.target.value })}
                          rows={4}
                          placeholder="Identidade fundamental ou regras extras personalizadas..."
                          className="bg-slate-50 border-slate-200 text-slate-800 dark:bg-black/60 dark:border-white/10 dark:text-primary/80 font-mono rounded-xl focus:border-primary/50 text-[13px] leading-relaxed p-5 placeholder:text-slate-400 dark:placeholder:text-white/20"
                        />
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary/50 to-transparent rounded-l-xl opacity-20 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1 flex items-center gap-2">
                          Modelo de Chat (IA) <Sparkles size={12} className="text-primary" />
                        </Label>
                        <Input
                          value={editAgent.openrouter_model || ""}
                          onChange={e => setEditAgent({ ...editAgent, openrouter_model: e.target.value })}
                          placeholder="google/gemini-3-flash-preview"
                          className="h-10 bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1 flex items-center gap-2">
                          Modelo Vision (Imagens) <Eye size={12} className="text-primary" />
                        </Label>
                        <Input
                          value={editAgent.vision_model || ""}
                          onChange={e => setEditAgent({ ...editAgent, vision_model: e.target.value })}
                          placeholder="google/gemini-3-flash-preview"
                          className="h-10 bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" /> Estilo & Aparência
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1 flex items-center gap-2">
                            Modo de Aparência (WhatsApp) <Eye size={12} className="opacity-50" />
                          </Label>
                          <Select
                            value={editAgent.chat_appearance_mode || "auto"}
                            onValueChange={(val) => setEditAgent({ ...editAgent, chat_appearance_mode: val as any })}
                          >
                            <SelectTrigger className="w-full bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-primary/50 focus:border-primary/50 h-10">
                              <SelectValue placeholder="Escolha o tema..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#0a0f16] border-slate-200 dark:border-white/10 rounded-xl shadow-2xl">
                              <SelectItem value="auto">Automático (Detectar Sistema)</SelectItem>
                              <SelectItem value="light">Modo Claro (WhatsApp Tradicional)</SelectItem>
                              <SelectItem value="dark">Modo Escuro (WhatsApp Dark)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-slate-500 italic ml-1">Força o estilo visual do chat independente da cor de tema escolhida.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign size={16} className="text-green-500" /> Inteligência de ROI
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Valor Médio de Venda (R$)</Label>
                          <Input
                            type="number"
                            value={editAgent.avg_conversion_value || 0}
                            onChange={(e) => setEditAgent({ ...editAgent, avg_conversion_value: parseFloat(e.target.value) || 0 })}
                            className="bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-lg"
                            placeholder="Ex: 500"
                          />
                          <p className="text-[10px] text-slate-500">Quanto vale, em média, um cliente fechado por este robô?</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="followup" className="mt-0 space-y-6">
                  <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/20 flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <RefreshCcw size={16} className="text-primary" /> Recuperação Automática (Follow-up)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-white/50">
                        Ative sequências de até 5 mensagens para leads que pararem de responder.
                      </p>
                    </div>
                    <Switch
                      checked={editAgent.follow_up_enabled || false}
                      onCheckedChange={(val) => setEditAgent({ ...editAgent, follow_up_enabled: val })}
                      className="data-[state=checked]:bg-primary shadow-[0_0_10px_rgba(0,255,157,0.3)]"
                    />
                  </div>

                  <div className="space-y-4">
                    {(editAgent.follow_up_config || [
                      { id: 1, delay_hours: 2, message: "" },
                      { id: 2, delay_hours: 24, message: "" },
                      { id: 3, delay_hours: 48, message: "" }
                    ]).map((step, idx) => (
                      <div key={step.id} className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] space-y-3 relative overflow-hidden group">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] font-bold bg-white dark:bg-black/20 text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/10">
                            MENSAGEM {idx + 1}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-primary/70" />
                            <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter">Aguardar</span>
                            <Input
                              type="number"
                              value={step.delay_hours}
                              onChange={(e) => {
                                const newConfig = [...(editAgent.follow_up_config || [])];
                                newConfig[idx] = { ...step, delay_hours: parseInt(e.target.value) || 0 };
                                setEditAgent({ ...editAgent, follow_up_config: newConfig });
                              }}
                              className="w-16 h-7 text-[11px] bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 text-center font-bold rounded-lg"
                            />
                            <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter">Horas</span>
                          </div>
                        </div>
                        <Textarea
                          value={step.message}
                          onChange={(e) => {
                            const newConfig = [...(editAgent.follow_up_config || [])];
                            newConfig[idx] = { ...step, message: e.target.value };
                            setEditAgent({ ...editAgent, follow_up_config: newConfig });
                          }}
                          placeholder="Ex: Olá! Ainda estou por aqui para te ajudar..."
                          className="bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl focus:border-primary/50 p-3 min-h-[60px]"
                        />
                      </div>
                    ))}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const current = editAgent.follow_up_config || [];
                        if (current.length < 5) {
                          setEditAgent({
                            ...editAgent,
                            follow_up_config: [...current, { id: Date.now(), delay_hours: 24, message: "" }]
                          });
                        }
                      }}
                      className="w-full border border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl h-10"
                    >
                      <Plus size={14} className="mr-2" /> Adicionar mais um passo (Máx 5)
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="widget" className="mt-0 space-y-6">
                  <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                      <Sparkles size={16} className="text-primary" /> Conversão Ativa
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      Configure quando o chat deve abrir sozinho para abordar o visitante.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1">Abrir após (segundos)</Label>
                      <Input
                        type="number"
                        value={editAgent.widget_trigger_seconds || 0}
                        onChange={e => setEditAgent({ ...editAgent, widget_trigger_seconds: parseInt(e.target.value) || 0 })}
                        className="h-10 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1">Abrir ao scrollar (%)</Label>
                      <Input
                        type="number"
                        value={editAgent.widget_trigger_scroll || 0}
                        onChange={e => setEditAgent({ ...editAgent, widget_trigger_scroll: parseInt(e.target.value) || 0 })}
                        className="h-10 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest ml-1">Posição do Widget</Label>
                    <div className="flex gap-3">
                      {["bottom-right", "bottom-left"].map((pos) => (
                        <Button
                          key={pos}
                          variant={editAgent.widget_position === pos ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditAgent({ ...editAgent, widget_position: pos })}
                          className={`flex-1 rounded-xl h-10 font-bold ${editAgent.widget_position === pos ? "bg-primary text-black" : "dark:border-white/10"}`}
                        >
                          {pos === "bottom-right" ? "Direita" : "Esquerda"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 space-y-3">
                    <Label className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-tighter">
                      <Code2 size={14} /> Código de Incorporação do Agente
                    </Label>
                    <div className="bg-black/40 p-3 rounded-xl font-mono text-[10px] text-white/70 break-all border border-white/5 max-h-[100px] overflow-y-auto">
                      {`<!-- Chat Vox Agent: ${editAgent.name} -->
<script>
(function(){
  var d=document,s=d.createElement('script');
  s.src='${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-widget?id=${user?.id}&agent=${editAgent.id}';
  s.setAttribute('data-vox-id','${user?.id}');
  s.setAttribute('data-vox-agent-id','${editAgent.id}');
  s.setAttribute('data-vox-origin','${window.location.origin}');
  s.async=true;
  d.head.appendChild(s);
})();
</script>`}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-primary hover:text-primary hover:bg-primary/10 text-xs font-bold gap-2"
                      onClick={() => {
                        const code = `<!-- Chat Vox Agent: ${editAgent.name} -->
<script>
(function(){
  var d=document,s=d.createElement('script');
  s.src='${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-widget?id=${user?.id}&agent=${editAgent.id}';
  s.setAttribute('data-vox-id','${user?.id}');
  s.setAttribute('data-vox-agent-id','${editAgent.id}');
  s.setAttribute('data-vox-origin','${window.location.origin}');
  s.async=true;
  d.head.appendChild(s);
})();
</script>`;
                        navigator.clipboard.writeText(code);
                        toast({ title: "Código do Agente copiado!" });
                      }}
                    >
                      <Copy size={14} /> Copiar Código Master
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="mt-0 space-y-4">
                  <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200 dark:border-white/5 mb-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                      <BookOpen size={16} className="text-primary" /> Cérebro do Agente
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      Adicione informações exclusivas deste agente. Ele usará esses dados para responder clientes com precisão.
                    </p>
                  </div>
                  {user && <KnowledgeBase userId={user.id} agentId={editAgent.id} />}
                </TabsContent>

                <TabsContent value="links" className="mt-0 space-y-4">
                  <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20 mb-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                      <LinkIcon2 size={16} className="text-primary" /> Atalhos de Conversão (CTA)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      Cadastre links estratégicos (WhatsApp, Checkout, Agendamento) que a IA poderá oferecer como botões de alta conversão.
                    </p>
                  </div>
                  <AgentButtonsManager agentId={editAgent.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-black/40 flex justify-end gap-3 rounded-b-3xl">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 font-bold rounded-xl" onClick={() => setEditAgent(null)}>Interromper</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-black font-extrabold rounded-xl px-8 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              GRAVAR MATRIZ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-white dark:bg-[#0a0f16] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-500 font-bold text-xl flex items-center gap-2">
              <Trash2 size={20} /> Desativar Permanentemente
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-white/60 text-base font-medium mt-3">
              O agente <strong>"{deleteTarget?.name}"</strong> será apagado do cluster. As conversas anexadas a ele perderão o contexto master. Confirmar o purge?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 font-bold rounded-xl" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" className="font-bold rounded-xl bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)]" onClick={handleDelete}>Confirmar Purge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agents;
