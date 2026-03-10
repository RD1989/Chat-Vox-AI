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
  DollarSign, TrendingUp, Wallet, Link2, CreditCard, ImagePlus, UserCheck,
  FileStack, LayoutGrid, Globe, ShieldCheck, HardDrive, FileText, Moon, Sun,
  X, Palette, Monitor, BookOpen, Layers, Book, Terminal, BrainCircuit
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingWizard } from "@/components/agents/OnboardingWizard";
import { KnowledgeBase } from "@/components/settings/KnowledgeBase";
import { AgentButtonsManager } from "@/components/agents/AgentButtonsManager";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { ChatThemeSelector, type ChatTheme } from "@/components/settings/ChatThemeSelector";

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  welcome_message: string;
  ai_avatar_url: string | null;
  primary_color: string;
  is_active: boolean;
  created_at: string;
  pix_key?: string;
  checkout_url?: string;
  product_links?: { id: string; name: string; url: string; }[];
  meta_api_token?: string;
  ask_whatsapp?: boolean;
  ai_image_generation?: boolean;
  product_media?: string[];
  social_proof_media?: string[];
  chat_theme?: string;
  chat_appearance_mode?: "light" | "dark" | "auto";
  chat_theme_config?: any;
  custom_css?: string;
  widget_trigger_seconds?: number;
  widget_trigger_scroll?: number;
  widget_position?: string;
  follow_up_enabled?: boolean;
  follow_up_config?: { id: number; delay_hours: number; message: string; }[];
  predefined_message?: string;
  organic_lead_capture?: boolean;
  openrouter_model?: string;
  vision_model?: string;
  avg_conversion_value?: number;
  catalog_url?: string;
  site_url?: string;
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
  avg_conversion_value?: number | null;
  catalog_url?: string;
  site_url?: string;
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
    setAgentConfig(parseSystemPrompt(agent.system_prompt || "Você é um assistente virtual útil de vendas."));
    setPixelsConfig(agent.chat_theme_config?.pixels || {});
    setEditAgent({
      ...agent,
      avg_conversion_value: agent.avg_conversion_value || 0,
      pix_key: agent.pix_key || "",
      checkout_url: agent.checkout_url || "",
      product_links: agent.product_links || [],
      catalog_url: agent.catalog_url || "",
      site_url: agent.site_url || "",
      meta_api_token: agent.meta_api_token || "",
      ask_whatsapp: agent.ask_whatsapp ?? false,
      ai_image_generation: agent.ai_image_generation ?? false,
      product_media: agent.product_media || [],
      social_proof_media: agent.social_proof_media || [],
      chat_theme: agent.chat_theme || "whatsapp",
      chat_appearance_mode: agent.chat_appearance_mode || "dark",
      chat_theme_config: agent.chat_theme_config || {
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
      },
      custom_css: agent.custom_css || "",
      widget_trigger_seconds: agent.widget_trigger_seconds || 5,
      widget_trigger_scroll: agent.widget_trigger_scroll || 50,
      widget_position: agent.widget_position || "bottom-right"
    });
  };

  const addProductLink = () => {
    if (!editAgent) return;
    const newLink = { id: Math.random().toString(36).substr(2, 9), name: "", url: "" };
    setEditAgent({ ...editAgent, product_links: [...(editAgent.product_links || []), newLink] });
  };

  const removeProductLink = (id: string) => {
    if (!editAgent) return;
    setEditAgent({ ...editAgent, product_links: editAgent.product_links?.filter(l => l.id !== id) });
  };

  const updateProductLink = (id: string, field: 'name' | 'url', value: string) => {
    if (!editAgent) return;
    setEditAgent({
      ...editAgent,
      product_links: editAgent.product_links?.map(l => l.id === id ? { ...l, [field]: value } : l)
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
        name: editAgent.name,
        system_prompt: updatedPrompt,
        welcome_message: editAgent.welcome_message,
        ai_avatar_url: editAgent.ai_avatar_url,
        primary_color: editAgent.primary_color,
        is_active: editAgent.is_active,
        chat_theme_config: updatedAgent.chat_theme_config,
        openrouter_model: editAgent.openrouter_model,
        vision_model: editAgent.vision_model,
        follow_up_enabled: editAgent.follow_up_enabled,
        follow_up_config: editAgent.follow_up_config,
        widget_trigger_seconds: editAgent.widget_trigger_seconds,
        widget_trigger_scroll: editAgent.widget_trigger_scroll,
        widget_position: editAgent.widget_position,
        avg_conversion_value: agentConfig.avg_conversion_value,
        pix_key: editAgent.pix_key,
        checkout_url: editAgent.checkout_url,
        product_links: editAgent.product_links,
        catalog_url: agentConfig.catalog_url,
        site_url: agentConfig.site_url,
        meta_api_token: editAgent.meta_api_token,
        ask_whatsapp: editAgent.ask_whatsapp,
        ai_image_generation: editAgent.ai_image_generation,
        product_media: editAgent.product_media,
        social_proof_media: editAgent.social_proof_media,
        predefined_message: editAgent.predefined_message,
        organic_lead_capture: editAgent.organic_lead_capture,
        chat_theme: editAgent.chat_theme,
        chat_appearance_mode: editAgent.chat_appearance_mode,
        custom_css: editAgent.custom_css,
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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'social') => {
    const file = e.target.files?.[0];
    if (!file || !editAgent || !user) return;

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `agent-assets/${user.id}/${editAgent.id}/${type}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('agent_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agent_assets')
        .getPublicUrl(filePath);

      if (type === 'product') {
        const product_media = [...(editAgent.product_media || []), publicUrl];
        setEditAgent({ ...editAgent, product_media });
      } else {
        const social_proof_media = [...(editAgent.social_proof_media || []), publicUrl];
        setEditAgent({ ...editAgent, social_proof_media });
      }

      toast({ title: "Mídia enviada com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = (url: string, type: 'product' | 'social') => {
    if (!editAgent) return;
    if (type === 'product') {
      const product_media = (editAgent.product_media || []).filter(m => m !== url);
      setEditAgent({ ...editAgent, product_media });
    } else {
      const social_proof_media = (editAgent.social_proof_media || []).filter(m => m !== url);
      setEditAgent({ ...editAgent, social_proof_media });
    }
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
        <DialogContent className="w-[96vw] max-w-[96vw] lg:max-w-[calc(100vw-17rem)] h-[96vh] max-h-[96vh] bg-white dark:bg-[#0a0f16] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-0 overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
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
            <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar">
              <Tabs defaultValue="identity" className="w-full flex flex-col h-full space-y-4">
                <TabsList className="w-full flex-wrap h-auto justify-start bg-slate-100 dark:bg-black/40 p-1 mb-6 rounded-xl border border-slate-200 dark:border-white/5 gap-1">
                  <TabsTrigger value="identity" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <Bot size={13} /> Identidade
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2 text-emerald-600 dark:text-primary">
                    <Wallet size={13} /> Vendas & Links
                  </TabsTrigger>
                  <TabsTrigger value="media" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <ImagePlus size={13} /> Mídias
                  </TabsTrigger>
                  <TabsTrigger value="automation" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <Target size={13} /> Automação
                  </TabsTrigger>
                  <TabsTrigger value="followup" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <RefreshCcw size={13} /> Follow-up
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <Palette size={13} /> Aparência
                  </TabsTrigger>
                  <TabsTrigger value="widget" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <Code2 size={13} /> Widget
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <BookOpen size={13} /> Cérebro
                  </TabsTrigger>
                  <TabsTrigger value="links" className="rounded-lg text-[11px] font-bold gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-white/10 px-3 py-2">
                    <Link2 size={13} /> CTAs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CreditCard size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Links & Pagamento</h4>
                      <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">Configurações para monetizar seu chatbot e direcionar leads.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Wallet size={12} className="text-emerald-500" /> Chave PIX
                      </Label>
                      <Input
                        value={editAgent.pix_key}
                        onChange={e => setEditAgent({ ...editAgent, pix_key: e.target.value })}
                        placeholder="Email, CPF, Telefone ou Aleatória"
                        className="h-11 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-primary/20 focus:border-primary/50 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <DollarSign size={12} className="text-emerald-500" /> Link de Checkout
                      </Label>
                      <Input
                        value={editAgent.checkout_url}
                        onChange={e => setEditAgent({ ...editAgent, checkout_url: e.target.value })}
                        placeholder="https://seucheckout.com"
                        className="h-11 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-primary/20 focus:border-primary/50 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <ShoppingBag size={12} className="text-emerald-500" /> Links de Produtos (Múltiplos)
                      </Label>
                      <Button variant="ghost" size="sm" onClick={addProductLink} className="h-7 text-[10px] font-bold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg">
                        <Plus size={12} className="mr-1" /> Adicionar Produto
                      </Button>
                    </div>

                    <div className="space-y-2 bg-slate-50/30 dark:bg-black/20 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/5 min-h-[60px]">
                      {editAgent.product_links?.length === 0 && (
                        <p className="text-[11px] text-center py-4 text-slate-400 dark:text-white/20 italic">Nenhum produto adicional cadastrado.</p>
                      )}
                      {editAgent.product_links?.map((link) => (
                        <div key={link.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                          <Input
                            value={link.name}
                            onChange={e => updateProductLink(link.id, 'name', e.target.value)}
                            placeholder="Nome do Produto"
                            className="h-10 text-[11px] bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 flex-1 rounded-xl"
                          />
                          <Input
                            value={link.url}
                            onChange={e => updateProductLink(link.id, 'url', e.target.value)}
                            placeholder="https://checkout.com"
                            className="h-10 text-[11px] bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 flex-[2] rounded-xl"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeProductLink(link.id)} className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <LayoutGrid size={12} className="text-emerald-500" /> Cardápio / Catálogo
                      </Label>
                      <Input
                        value={editAgent.catalog_url}
                        onChange={e => setEditAgent({ ...editAgent, catalog_url: e.target.value })}
                        placeholder="https://seucardapio.com"
                        className="h-11 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-primary/20 focus:border-primary/50 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Globe size={12} className="text-emerald-500" /> Site / Landing Page
                      </Label>
                      <Input
                        value={editAgent.site_url}
                        onChange={e => setEditAgent({ ...editAgent, site_url: e.target.value })}
                        placeholder="https://seusite.com.br"
                        className="h-11 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-primary/20 focus:border-primary/50 text-xs font-medium"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="automation" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Target size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gatilhos Master & CAPI</h4>
                      <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">Controle como a IA interage e rastreia conversões via servidor.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4 bg-slate-50/50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-[12px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <UserCheck size={14} className="text-primary" /> Capturar WhatsApp
                          </Label>
                          <p className="text-[10px] text-slate-500 dark:text-white/40">Pedir número do lead na conversa</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-[12px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Bot size={14} className="text-primary" /> Captura Orgânica
                          </Label>
                          <p className="text-[10px] text-slate-500 dark:text-white/40">IA "pesca" os dados naturalmente no papo</p>
                        </div>
                        <Switch
                          checked={editAgent.organic_lead_capture}
                          onCheckedChange={checked => setEditAgent({ ...editAgent, organic_lead_capture: checked })}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <MessageSquare size={12} className="text-primary" /> Mensagem de Início (WhatsApp Style)
                        </Label>
                        <Input
                          value={editAgent.predefined_message || ""}
                          onChange={e => setEditAgent({ ...editAgent, predefined_message: e.target.value })}
                          placeholder="Ex: Quero saber mais sobre o produto..."
                          className="h-11 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-primary/20 focus:border-primary/50 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <ShieldCheck size={12} className="text-primary" /> Meta CAPI Token
                        </Label>
                        <Input
                          value={editAgent.meta_api_token}
                          onChange={e => setEditAgent({ ...editAgent, meta_api_token: e.target.value })}
                          placeholder="EAA..."
                          className="h-11 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-primary/20 focus:border-primary/50 text-[10px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-100 dark:border-white/5 pt-4">
                    <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Configuração do Widget</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-white/40 ml-1">Tempo de Aparição (seg)</Label>
                        <Input
                          type="number"
                          value={editAgent.widget_trigger_seconds}
                          onChange={e => setEditAgent({ ...editAgent, widget_trigger_seconds: Number(e.target.value) })}
                          className="h-10 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-xs rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-medium text-slate-500 dark:text-white/40 ml-1">Gatilho de Scroll (%)</Label>
                        <Input
                          type="number"
                          value={editAgent.widget_trigger_scroll}
                          onChange={e => setEditAgent({ ...editAgent, widget_trigger_scroll: Number(e.target.value) })}
                          className="h-10 bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-xs rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-start gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileStack size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Materiais & Prova Social</h4>
                      <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">Mídias que a IA usará para persuadir e demonstrar o produto.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <HardDrive size={20} />
                      </div>
                      <h5 className="text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-wider">Mídias do Produto</h5>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 max-w-[200px] mx-auto">Fotos e vídeos que a IA usará para demonstrar seu produto.</p>

                      <div className="flex flex-wrap gap-2 mb-3 mt-2 justify-center">
                        {editAgent.product_media?.map((url, i) => (
                          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                            <img src={url} className="w-full h-full object-cover" />
                            <button onClick={() => removeMedia(url, 'product')} className="absolute top-0 right-0 p-1 bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="relative inline-block mt-2">
                        <input
                          type="file"
                          id="product-media-upload"
                          className="hidden"
                          accept="image/*,video/*"
                          onChange={(e) => handleMediaUpload(e, 'product')}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById('product-media-upload')?.click()}
                          className="h-8 text-[10px] bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 font-bold"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Fazer Upload
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Sparkles size={20} />
                      </div>
                      <h5 className="text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-wider">Prova Social</h5>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 max-w-[200px] mx-auto">Prints de depoimentos e resultados para gerar confiança.</p>

                      <div className="flex flex-wrap gap-2 mb-3 mt-2 justify-center">
                        {editAgent.social_proof_media?.map((url, i) => (
                          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                            <img src={url} className="w-full h-full object-cover" />
                            <button onClick={() => removeMedia(url, 'social')} className="absolute top-0 right-0 p-1 bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="relative inline-block mt-2">
                        <input
                          type="file"
                          id="social-media-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, 'social')}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById('social-media-upload')?.click()}
                          className="h-8 text-[10px] bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 font-bold"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Fazer Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-purple-500/5 dark:bg-purple-500/10 p-5 rounded-3xl border border-purple-500/20 flex flex-col gap-1 mb-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Palette size={18} className="text-purple-500" /> Identidade Visual e Temas
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/60 font-medium">
                      Configure as cores da marca, o estilo das mensagens e o comportamento visual noturno do robô.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                      <ChatThemeSelector
                        activeMode={(editAgent.chat_theme as any) || "whatsapp"}
                        onModeChange={(mode) => setEditAgent({ ...editAgent, chat_theme: mode })}
                        themeConfig={editAgent.chat_theme_config}
                        onThemeChange={(config) => setEditAgent({ ...editAgent, chat_theme_config: config })}
                        primaryColor={editAgent.primary_color}
                        aiName={editAgent.name}
                        aiAvatarUrl={editAgent.ai_avatar_url || ""}
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                        <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-4 block flex items-center gap-2">
                          <Monitor size={14} className="text-purple-500" /> Esquema de Núcleo
                        </Label>
                        <div className="flex flex-col gap-3">
                          {[
                            { key: "dark" as const, label: "Forçar Escuro", icon: Moon, color: "text-indigo-400" },
                            { key: "light" as const, label: "Forçar Claro", icon: Sun, color: "text-amber-500" },
                            { key: "auto" as const, label: "Interagir Auto", icon: Monitor, color: "text-slate-400" },
                          ].map((m) => (
                            <button
                              key={m.key}
                              onClick={() => setEditAgent({ ...editAgent, chat_appearance_mode: m.key })}
                              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left group ${editAgent.chat_appearance_mode === m.key
                                ? "border-purple-500 bg-purple-500/5 shadow-[0_4px_20px_rgba(168,85,247,0.15)]"
                                : "border-slate-200 dark:border-white/10 hover:border-purple-500/30 hover:bg-white dark:hover:bg-white/5"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-white dark:bg-black/40 shadow-sm border border-slate-100 dark:border-white/5 ${editAgent.chat_appearance_mode === m.key ? 'text-purple-500' : m.color}`}>
                                  <m.icon size={16} />
                                </div>
                                <span className={`text-[13px] font-bold ${editAgent.chat_appearance_mode === m.key ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-white/70'}`}>{m.label}</span>
                              </div>
                              {editAgent.chat_appearance_mode === m.key && (
                                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-3xl p-6 shadow-sm">
                        <Label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                          <Code2 size={14} className="text-blue-500" /> Folha de Estilos Avançada (CSS)
                        </Label>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 mb-3 leading-relaxed">
                          Injete varáveis gráficas puras. Nível Desenvolvedor.
                        </p>
                        <div className="relative group/css">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-transparent rounded-2xl blur opacity-0 group-hover/css:opacity-100 transition duration-500"></div>
                          <Textarea
                            value={editAgent.custom_css || ""}
                            onChange={(e) => setEditAgent({ ...editAgent, custom_css: e.target.value })}
                            placeholder=".chatvox-bubble { mix-blend-mode: ... }"
                            className="relative font-mono text-[11px] bg-white dark:bg-[#0a0f16]/90 border-blue-200 dark:border-blue-500/20 text-slate-800 dark:text-blue-400 rounded-2xl focus:ring-blue-500/30 focus:border-blue-500/50 p-4 min-h-[140px] resize-none transition-all shadow-inner custom-scrollbar"
                            rows={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="widget" className="mt-0 space-y-6 animate-in fade-in duration-300">
                  <div className="bg-slate-50/50 dark:bg-black/40 p-5 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" /> Gatilhos Master Script
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/40">
                      Configure como o widget flutuante deste agente específico se comportará no seu site.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Clock size={16} />
                        </div>
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Tempo na Página</Label>
                      </div>
                      <div className="flex items-end gap-2">
                        <Input
                          type="number"
                          value={editAgent.widget_trigger_seconds || 0}
                          onChange={e => setEditAgent({ ...editAgent, widget_trigger_seconds: parseInt(e.target.value) || 0 })}
                          className="h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-center font-bold text-lg rounded-2xl"
                        />
                        <span className="mb-3 text-xs font-bold text-muted-foreground">SEG</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <TrendingUp size={16} />
                        </div>
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Scroll do Site</Label>
                      </div>
                      <div className="flex items-end gap-2">
                        <Input
                          type="number"
                          value={editAgent.widget_trigger_scroll || 0}
                          onChange={e => setEditAgent({ ...editAgent, widget_trigger_scroll: parseInt(e.target.value) || 0 })}
                          className="h-12 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-center font-bold text-lg rounded-2xl"
                        />
                        <span className="mb-3 text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">Lado da Exibição</Label>
                    <div className="flex gap-4">
                      {[
                        { id: "bottom-right", label: "Canto Direito", icon: "👉" },
                        { id: "bottom-left", label: "Canto Esquerdo", icon: "👈" }
                      ].map((pos) => (
                        <Button
                          key={pos.id}
                          variant={editAgent.widget_position === pos.id ? "default" : "outline"}
                          size="lg"
                          onClick={() => setEditAgent({ ...editAgent, widget_position: pos.id })}
                          className={`flex-1 rounded-2xl h-14 font-bold border-2 transition-all ${editAgent.widget_position === pos.id ? "bg-primary text-black border-primary shadow-[0_5px_15px_rgba(0,255,157,0.3)]" : "dark:border-white/5 dark:bg-black/20"}`}
                        >
                          <span className="mr-2 text-xl">{pos.icon}</span> {pos.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 dark:bg-black/40 rounded-3xl border border-primary/20 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Code2 size={80} className="text-primary" />
                    </div>
                    <Label className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest relative z-10">
                      <Code2 size={16} /> Script de Instalação do Agente
                    </Label>
                    <div className="bg-black p-4 rounded-2xl font-mono text-[11px] text-white/60 break-all border border-white/5 max-h-[120px] overflow-y-auto leading-relaxed relative z-10">
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
                      variant="secondary"
                      size="sm"
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-none text-xs font-bold gap-2 h-10 rounded-xl relative z-10"
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
                  <div className="bg-slate-50 dark:bg-black/40 p-5 rounded-3xl border border-slate-200 dark:border-white/5 mb-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                      <BookOpen size={18} className="text-primary" /> Cérebro Estratégico
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
                      Alimente este agente com documentos, FAQs e informações exclusivas para respostas ultra-precisas.
                    </p>
                  </div>
                  {user && <KnowledgeBase userId={user.id} agentId={editAgent.id} />}
                </TabsContent>

                <TabsContent value="links" className="mt-0 space-y-4">
                  <div className="bg-gradient-to-br from-primary/20 to-transparent p-6 rounded-3xl border border-primary/20 mb-4 shadow-glass">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                      <Link2 size={18} className="text-primary" /> Gatilhos de Conversão (CTA)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/40 font-medium leading-relaxed">
                      Gerencie botões de alta conversão (WhatsApp, Checkout, Agendamento) que a IA poderá oferecer durante o chat.
                    </p>
                  </div>
                  <AgentButtonsManager agentId={editAgent.id} />
                </TabsContent>

                <TabsContent value="identity" className="space-y-6 mt-0 animate-in fade-in duration-300">
                  <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-3xl border border-primary/20 flex flex-col gap-1 mb-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bot size={18} className="text-primary" /> Matrix de Comportamento
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/60 font-medium">
                      Modele a personalidade, os objetivos e as restrições éticas deste clone de IA.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 shadow-sm">
                        <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2 mb-3">
                          <Mic size={14} className="text-primary" /> Personalidade e Tom de Voz
                        </Label>
                        <Select
                          value={agentConfig.voice_tone}
                          onValueChange={(val) => setAgentConfig({ ...agentConfig, voice_tone: val })}
                        >
                          <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-2xl focus:ring-primary/20 focus:border-primary/50 h-12 transition-all font-semibold">
                            <SelectValue placeholder="Como o robô deve falar?" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#0d121b] border-slate-200 dark:border-white/10 rounded-2xl shadow-xl">
                            <SelectItem value="Profissional e Respeitoso">🎩 Profissional e Formal</SelectItem>
                            <SelectItem value="Amigável e Empático">🤝 Amigável e Empático</SelectItem>
                            <SelectItem value="Direto e Focado em Conversão">🎯 Direto (Alta Conversão)</SelectItem>
                            <SelectItem value="Técnico e Analítico">🔬 Técnico e Analítico</SelectItem>
                            <SelectItem value="Descontraído e Humorístico">⚡ Jovem e Descontraído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-5 rounded-3xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 shadow-sm">
                        <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest ml-1 flex items-center gap-2 mb-3">
                          Objetivos Principais <Target size={14} className="text-emerald-500" />
                        </Label>
                        <Textarea
                          value={agentConfig.priorities}
                          onChange={e => setAgentConfig({ ...agentConfig, priorities: e.target.value })}
                          placeholder="Ex: Coletar WhatsApp primeiro..."
                          className="bg-white dark:bg-black/40 border-emerald-200 dark:border-emerald-500/10 text-slate-900 dark:text-white rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 text-xs p-4 min-h-[110px] transition-all"
                        />
                      </div>

                      <div className="p-5 rounded-3xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 shadow-sm">
                        <Label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest ml-1 flex items-center gap-2 mb-3">
                          Regras Intocáveis (Proibições) <AlertTriangle size={14} className="text-rose-500" />
                        </Label>
                        <Textarea
                          value={agentConfig.restrictions}
                          onChange={e => setAgentConfig({ ...agentConfig, restrictions: e.target.value })}
                          placeholder="Ex: Não dar descontos acima de 10%..."
                          className="bg-white dark:bg-black/40 border-rose-200 dark:border-rose-500/10 text-slate-900 dark:text-white rounded-2xl focus:ring-rose-500/20 focus:border-rose-500/50 text-xs p-4 min-h-[110px] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                          Valor Médio de Conversão <DollarSign size={12} className="text-green-500/70" />
                        </Label>
                        <Input
                          type="number"
                          value={agentConfig.avg_conversion_value || ''}
                          onChange={e => setAgentConfig({ ...agentConfig, avg_conversion_value: parseFloat(e.target.value) || null })}
                          placeholder="Ex: 150.00"
                          className="bg-slate-50/50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-2xl focus:ring-primary/20 focus:border-primary/50 h-12 text-xs p-4 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                          URL do Catálogo <Book size={12} className="text-blue-500/70" />
                        </Label>
                        <Input
                          type="url"
                          value={agentConfig.catalog_url || ''}
                          onChange={e => setAgentConfig({ ...agentConfig, catalog_url: e.target.value })}
                          placeholder="Ex: https://seusite.com/catalogo"
                          className="bg-slate-50/50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-2xl focus:ring-primary/20 focus:border-primary/50 h-12 text-xs p-4 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                        URL do Site <Globe size={12} className="text-purple-500/70" />
                      </Label>
                      <Input
                        type="url"
                        value={agentConfig.site_url || ''}
                        onChange={e => setAgentConfig({ ...agentConfig, site_url: e.target.value })}
                        placeholder="Ex: https://seusite.com"
                        className="bg-slate-50/50 border-slate-200 text-slate-900 dark:bg-black/40 dark:border-white/10 dark:text-white rounded-2xl focus:ring-primary/20 focus:border-primary/50 h-12 text-xs p-4 transition-all"
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                          <BrainCircuit size={100} className="text-primary" />
                        </div>
                        <Label className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2 mb-3 relative z-10">
                          Matriz de Inteligência (Power Prompt) <Terminal size={14} className="text-primary" />
                        </Label>
                        <p className="text-[10px] text-slate-400 dark:text-white/40 mb-3 leading-relaxed relative z-10">
                          Engenharia de Prompt pura. Aqui você define o cerne cognitivo do robô.
                        </p>
                        <div className="relative group/prompt z-10">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-transparent to-primary/10 rounded-2xl blur opacity-30 group-hover/prompt:opacity-100 transition duration-500"></div>
                          <Textarea
                            value={agentConfig.base_prompt}
                            onChange={e => setAgentConfig({ ...agentConfig, base_prompt: e.target.value })}
                            rows={15}
                            placeholder="Instruções fundamentais que definem a existência da IA..."
                            className="relative bg-white dark:bg-[#0a0f16]/90 border-slate-200 dark:border-primary/20 text-slate-800 dark:text-primary/90 font-mono rounded-2xl focus:ring-primary/30 focus:border-primary/50 text-[12px] leading-relaxed p-5 transition-all shadow-inner custom-scrollbar"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-black/40 flex justify-end gap-3 rounded-b-3xl">
                <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 font-bold rounded-xl" onClick={() => setEditAgent(null)}>Interromper</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-black font-extrabold rounded-xl px-8 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  GRAVAR MATRIZ
                </Button>
              </div>
            </div>
          )}
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
