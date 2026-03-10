import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Trash2, Tag, Plus, X, Phone, Mail, Clock, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface VoxLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  qualified: boolean;
  qualification_score: number | null;
  city: string | null;
  created_at: string;
  notes: string | null;
  tags: string[];
  handoff_requested: boolean;
}

const COLUMNS = [
  { status: "novo", label: "Novos", dot: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" },
  { status: "qualificado", label: "Qualificados", dot: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" },
  { status: "em_atendimento", label: "Em Atendimento", dot: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" },
  { status: "venda", label: "Vendas e Fechamento", dot: "bg-primary shadow-[0_0_10px_rgba(0,255,157,0.5)]" },
];

const TAG_COLORS: Record<string, string> = {
  "Quente": "bg-destructive/20 text-destructive border-transparent shadow-[0_0_10px_rgba(255,0,0,0.2)]",
  "Frio": "bg-info/20 text-info border-transparent",
  "High Ticket": "bg-warning/20 text-warning border-transparent shadow-[0_0_10px_rgba(250,204,21,0.2)]",
  "Orgânico": "bg-primary/20 text-primary border-transparent",
  "Tráfego Pago": "bg-purple-500/20 text-purple-400 border-transparent",
  "Follow-up": "bg-muted text-foreground border-transparent",
  "Urgente": "bg-red-500/20 text-red-500 border-transparent animate-pulse",
  "Transbordo": "bg-yellow-500/20 text-yellow-500 border-transparent animate-pulse",
};

const getTagColor = (tag: string) => TAG_COLORS[tag] || "bg-secondary text-secondary-foreground";

const CRM = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<VoxLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Estados do Modal de Novo Cliente Manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadStatus, setNewLeadStatus] = useState("novo");
  const [isSavingLead, setIsSavingLead] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vox_leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setLeads(data as unknown as VoxLead[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("crm_leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "vox_leads", filter: `user_id=eq.${user.id}` }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchLeads]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("vox_leads").update({ status } as any).eq("id", id);
    if (error) { toast({ title: "Erro ao mover lead", variant: "destructive" }); return; }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("vox_leads").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Lead removido" });
  };

  const addTag = async (leadId: string, tag: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.tags?.includes(tag)) return;
    const newTags = [...(lead.tags || []), tag];
    await supabase.from("vox_leads").update({ tags: newTags } as any).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, tags: newTags } : l)));
  };

  const removeTag = async (leadId: string, tag: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const newTags = (lead.tags || []).filter((t) => t !== tag);
    await supabase.from("vox_leads").update({ tags: newTags } as any).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, tags: newTags } : l)));
  };

  const handleDrop = (status: string) => {
    if (draggedId) { updateStatus(draggedId, status); setDraggedId(null); }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !user) return;
    setIsSavingLead(true);

    const { error } = await supabase.from("vox_leads").insert([{
      user_id: user.id,
      name: newLeadName,
      phone: newLeadPhone || null,
      email: newLeadEmail || null,
      status: newLeadStatus,
    }]);

    setIsSavingLead(false);

    if (error) {
      toast({ title: "Erro ao cadastrar lead", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Cliente adicionado com sucesso!" });
    setIsModalOpen(false);
    setNewLeadName("");
    setNewLeadPhone("");
    setNewLeadEmail("");
    setNewLeadStatus("novo");
    fetchLeads(); // Recarregar Kanban
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-white/10 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary blur-[4px] animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 dark:text-white/50 text-sm font-medium tracking-wide">Sincronizando pipeline CRM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-white/60">CRM e Vendas</h1>
          <p className="text-sm text-slate-500 dark:text-white/40 mt-1">Arraste e solte os leads entre as colunas para atualizar seu status de pré-vendas.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(0,255,157,0.3)]">
              <Plus size={16} className="mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} required placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp (Telefone)</Label>
                <Input value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="Ex: 11999999999" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} placeholder="Ex: joao@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Fase no Funil</Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={newLeadStatus}
                  onChange={(e) => setNewLeadStatus(e.target.value)}
                >
                  {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
                </select>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={isSavingLead}>
                {isSavingLead ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {isSavingLead ? "Salvando..." : "Salvar Cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 pb-10 snap-x snap-mandatory custom-scrollbar md:snap-none">
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
              className="bg-white dark:bg-black/20 rounded-2xl p-4 min-h-[400px] max-h-[75vh] flex flex-col transition-all duration-300 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center shrink-0 md:shrink"
            >
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-white/10 relative">
                <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70">{col.label}</span>
                <span className="ml-auto text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 dark:text-white dark:bg-white/10 dark:border-white/10 px-2 py-0.5 rounded-full">{colLeads.length}</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {colLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={() => setDraggedId(lead.id)}
                    onDelete={() => deleteLead(lead.id)}
                    onAddTag={(tag) => addTag(lead.id, tag)}
                    onRemoveTag={(tag) => removeTag(lead.id, tag)}
                  />
                ))}
                {colLeads.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 dark:text-white/30 tracking-wide uppercase">Coluna Vazia</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div >
  );
};

interface LeadCardProps {
  lead: VoxLead;
  onDragStart: () => void;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const LeadCard = ({ lead, onDragStart, onDelete, onAddTag, onRemoveTag }: LeadCardProps) => {
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag("");
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all group shadow-sm ${lead.handoff_requested ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(250,204,21,0.2)] bg-amber-50 dark:bg-gradient-to-br dark:from-white/5 dark:to-warning/5' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="font-bold text-[13px] text-slate-900 dark:text-white truncate max-w-[140px]">{lead.name}</p>
          {lead.handoff_requested && (
            <Badge variant="outline" className="bg-warning/20 text-warning border-transparent px-1.5 py-0 shadow-[0_0_10px_rgba(250,204,21,0.2)] text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1">
              Transbordo
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {lead.phone && (
            <button
              onClick={() => window.open(`https://wa.me/55${lead.phone}`, "_blank")}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors"
            >
              <MessageCircle size={14} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors tooltip relative"
            title="Remover Lead"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-3 mb-4">
        {lead.email && <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/50"><Mail size={10} /> <span className="truncate">{lead.email}</span></div>}
        {lead.phone && <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/50"><Phone size={10} /> <span>{lead.phone}</span></div>}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {lead.city && (
          <Badge variant="outline" className="text-[9px] bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-white/60 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <MapPin size={8} /> {lead.city}
          </Badge>
        )}
        {(lead.tags || []).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${getTagColor(tag)}`}
          >
            <Tag size={8} />
            {tag}
            <button onClick={() => onRemoveTag(tag)} className="ml-0.5 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={8} />
            </button>
          </Badge>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-5 px-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-white/5 dark:border-white/10 flex items-center justify-center dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 text-[9px] font-bold text-slate-500 dark:text-white/50 gap-1">
              <Plus size={10} /> Add Tag
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4 border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111] backdrop-blur-xl rounded-2xl shadow-lg" align="start">
            <p className="text-[10px] font-bold text-slate-400 dark:text-white/60 uppercase tracking-widest mb-3">Atribuir Marcador</p>
            <div className="flex gap-2 mb-3">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Criar nova tag"
                className="h-8 text-xs bg-slate-50 border-slate-200 text-slate-800 dark:bg-white/5 dark:border-white/10 dark:text-white"
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button size="icon" variant="default" className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/80 text-black rounded-lg" onClick={handleAddTag}>
                <Plus size={14} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(TAG_COLORS).map((tag) => (
                <button
                  key={tag}
                  onClick={() => onAddTag(tag)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full hover:brightness-110 transition-all border outline-none focus:ring-2 focus:ring-primary ${getTagColor(tag)}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {lead.qualification_score != null && lead.qualification_score > 0 && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-white/5 relative group/score tooltip" title={`Score de Qualificação: ${lead.qualification_score}%`}>
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-200 dark:border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${lead.qualification_score > 70 ? 'bg-gradient-to-r from-emerald-500 to-primary dark:shadow-[0_0_8px_rgba(0,255,157,0.5)]' : lead.qualification_score > 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-destructive/80'}`}
              style={{ width: `${lead.qualification_score}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-700 dark:text-white uppercase">{lead.qualification_score}% Score</span>
        </div>
      )}

      <p className="text-[10px] text-slate-400 dark:text-white/30 mt-3 font-bold flex items-center gap-1 border-t border-slate-200 dark:border-white/5 pt-3">
        <Clock size={10} />
        {format(new Date(lead.created_at), "dd MMM · HH:mm", { locale: ptBR })}
      </p>
    </div>
  );
};

export default CRM;
