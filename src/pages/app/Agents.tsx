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
  Bot, Plus, Trash2, Copy, ExternalLink, Loader2, Save, Pencil, Power,
  MessageSquare, Users, Sparkles, Lock, Brain, Zap, ShieldAlert, UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarUpload } from "@/components/settings/AvatarUpload";

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  welcome_message: string;
  ai_avatar_url: string | null;
  primary_color: string;
  is_active: boolean;
  created_at: string;
  ai_persona: string;
  ai_tone: string;
  ai_objective: string;
  ai_restrictions: string;
  ai_cta: string;
  ai_qualification_question: string;
}

const Agents = () => {
  const { user } = useAuth();
  const planInfo = usePlanLimits();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);

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

  const handleCreate = async () => {
    if (!user || !canCreate) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("vox_agents")
      .insert({ user_id: user.id, name: `Agente ${agents.length + 1}` } as any)
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Erro ao criar agente", description: error.message, variant: "destructive" });
    } else if (data) {
      setAgents(prev => [...prev, data as unknown as Agent]);
      setEditAgent(data as unknown as Agent);
      toast({ title: "Agente criado!" });
    }
  };

  const handleSave = async () => {
    if (!editAgent) return;
    setSaving(true);
    const { error } = await supabase
      .from("vox_agents")
      .update({
        name: editAgent.name,
        system_prompt: editAgent.system_prompt,
        welcome_message: editAgent.welcome_message,
        primary_color: editAgent.primary_color,
        is_active: editAgent.is_active,
        ai_avatar_url: editAgent.ai_avatar_url,
        ai_persona: editAgent.ai_persona,
        ai_tone: editAgent.ai_tone,
        ai_objective: editAgent.ai_objective,
        ai_restrictions: editAgent.ai_restrictions,
        ai_cta: editAgent.ai_cta,
        ai_qualification_question: editAgent.ai_qualification_question,
      } as any)
      .eq("id", editAgent.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      setAgents(prev => prev.map(a => a.id === editAgent.id ? editAgent : a));
      setEditAgent(null);
      toast({ title: "Agente atualizado!" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("vox_agents").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      setAgents(prev => prev.filter(a => a.id !== deleteTarget.id));
      toast({ title: "Agente excluído" });
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
    toast({ title: "Link copiado!" });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Bot size={22} className="text-primary" /> Meus Agentes IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie múltiplos chatbots com personalidades e bases de conhecimento independentes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">
            <Users size={12} className="mr-1" />
            {agents.length}/{agentLimit ?? "∞"} agentes
          </Badge>
          <Button
            onClick={handleCreate}
            disabled={!canCreate || creating}
            size="sm"
            className="gap-1.5"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Novo Agente
          </Button>
        </div>
      </div>

      {!canCreate && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock size={18} className="text-warning shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Limite de agentes atingido</p>
              <p className="text-xs text-muted-foreground">
                Seu plano <strong>{planInfo.name}</strong> permite até {agentLimit} agente(s). Faça upgrade para criar mais.
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto shrink-0 text-xs" onClick={() => window.location.href = "/pricing"}>
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      )}

      {agents.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Crie seu primeiro agente IA</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Cada agente tem sua própria personalidade, prompt e base de conhecimento. Perfeito para diferentes departamentos ou nichos.
            </p>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              <Plus size={16} /> Criar Agente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`relative group transition-all hover:shadow-md ${agent.is_active ? "border-primary/20" : "border-border opacity-60"}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm overflow-hidden"
                          style={{ backgroundColor: agent.primary_color }}
                        >
                          {agent.ai_avatar_url ? (
                            <img src={agent.ai_avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                          ) : (
                            agent.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{agent.name}</CardTitle>
                          <CardDescription className="text-[10px]">
                            {agent.is_active ? "Ativo" : "Desativado"}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={() => toggleActive(agent)}
                        className="scale-75"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {agent.system_prompt || "Sem prompt personalizado"}
                    </p>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8 gap-1" onClick={() => setEditAgent(agent)}>
                        <Pencil size={11} /> Editar
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => copyLink(agent.id)}>
                        <Copy size={12} />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`/chat/${user?.id}?agent=${agent.id}`, "_blank")}>
                        <ExternalLink size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(agent)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editAgent} onOpenChange={(open) => !open && setEditAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot size={18} className="text-primary" /> Configurar Agente
            </DialogTitle>
            <DialogDescription>Personalize o comportamento, aparência e o cérebro deste agente.</DialogDescription>
          </DialogHeader>
          {editAgent && (
            <div className="space-y-4 py-2">
              {/* Identidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Nome do Agente</Label>
                  <Input
                    value={editAgent.name}
                    onChange={e => setEditAgent({ ...editAgent, name: e.target.value })}
                    placeholder="Ex: Vendas, Suporte, Agendamento..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-xs font-semibold">Cor</Label>
                  <input
                    type="color"
                    value={editAgent.primary_color}
                    onChange={e => setEditAgent({ ...editAgent, primary_color: e.target.value })}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Mensagem de Boas-Vindas</Label>
                <Textarea
                  value={editAgent.welcome_message}
                  onChange={e => setEditAgent({ ...editAgent, welcome_message: e.target.value })}
                  rows={2}
                />
              </div>

              {user && (
                <AvatarUpload
                  userId={user.id}
                  currentUrl={editAgent.ai_avatar_url || ""}
                  onUrlChange={(url) => setEditAgent({ ...editAgent, ai_avatar_url: url })}
                />
              )}

              {/* Cérebro IA */}
              <div className="border-t border-border pt-4 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Brain size={16} className="text-primary" /> Cérebro do Agente
                </h3>
                <p className="text-[11px] text-muted-foreground -mt-2">
                  Campos vazios herdam automaticamente das Configurações Globais.
                </p>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Persona (Quem é este agente?)</Label>
                  <Textarea
                    value={editAgent.ai_persona || ""}
                    onChange={e => setEditAgent({ ...editAgent, ai_persona: e.target.value })}
                    rows={2}
                    placeholder="Ex: Você é o João, especialista em vendas da empresa... (vazio = usa persona global)"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Tom de Voz</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {["profissional", "amigável", "descontraído", "formal", "persuasivo", "empático", "técnico", "divertido"].map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setEditAgent({ ...editAgent, ai_tone: tone })}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all capitalize ${editAgent.ai_tone === tone
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-primary/40"
                          }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Zap size={12} /> Objetivo Principal
                  </Label>
                  <Textarea
                    value={editAgent.ai_objective || ""}
                    onChange={e => setEditAgent({ ...editAgent, ai_objective: e.target.value })}
                    rows={2}
                    placeholder="Ex: Qualificar leads e agendar demonstrações... (vazio = usa objetivo global)"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">CTA (Chamada para Ação)</Label>
                  <Textarea
                    value={editAgent.ai_cta || ""}
                    onChange={e => setEditAgent({ ...editAgent, ai_cta: e.target.value })}
                    rows={2}
                    placeholder="Ex: 'Posso agendar sua avaliação para amanhã?'"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <UserCheck size={12} /> Pergunta de Qualificação
                  </Label>
                  <Textarea
                    value={editAgent.ai_qualification_question || ""}
                    onChange={e => setEditAgent({ ...editAgent, ai_qualification_question: e.target.value })}
                    rows={2}
                    placeholder="Ex: 'Qual é o seu orçamento disponível?'"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <ShieldAlert size={12} className="text-destructive" /> Restrições
                  </Label>
                  <Textarea
                    value={editAgent.ai_restrictions || ""}
                    onChange={e => setEditAgent({ ...editAgent, ai_restrictions: e.target.value })}
                    rows={3}
                    placeholder="Ex: Nunca fale mal da concorrência, não invente preços..."
                    className="text-xs"
                  />
                </div>
              </div>

              {/* System Prompt Avançado */}
              <div className="border-t border-border pt-4 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">System Prompt (Avançado)</Label>
                <Textarea
                  value={editAgent.system_prompt}
                  onChange={e => setEditAgent({ ...editAgent, system_prompt: e.target.value })}
                  rows={4}
                  placeholder="Instruções adicionais em formato livre (opcional)..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAgent(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Agente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o agente "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agents;
