import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Trash2, Tag, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  { status: "novo", label: "Novos", dot: "bg-blue-500" },
  { status: "qualificado", label: "Qualificados", dot: "bg-amber-500" },
  { status: "em_atendimento", label: "Em Atendimento", dot: "bg-emerald-500" },
  { status: "venda", label: "Vendas", dot: "bg-primary" },
];

const TAG_COLORS: Record<string, string> = {
  "Quente": "bg-destructive/10 text-destructive",
  "Frio": "bg-info/10 text-info",
  "High Ticket": "bg-warning/10 text-warning",
  "Orgânico": "bg-primary/10 text-primary",
  "Tráfego Pago": "bg-purple-500/10 text-purple-600",
  "Follow-up": "bg-muted text-muted-foreground",
  "Urgente": "bg-destructive/15 text-destructive",
  "Transbordo": "bg-warning/15 text-warning",
};

const getTagColor = (tag: string) => TAG_COLORS[tag] || "bg-secondary text-secondary-foreground";

const CRM = () => {
  const { user } = useAuth();
  const { request } = useApi();
  const [leads, setLeads] = useState<VoxLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    const { data } = await request<any[]>(`leads?user_id=${user.id}`);
    if (data) {
      // Parse tags JSON string to array if necessary
      const parsed = data.map(l => ({
        ...l,
        tags: typeof l.tags === "string" ? JSON.parse(l.tags) : (l.tags || [])
      }));
      setLeads(parsed as unknown as VoxLead[]);
    }
    setLoading(false);
  }, [user, request]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await request(`leads?id=${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    if (error) { toast({ title: "Erro ao mover lead", variant: "destructive" }); return; }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const deleteLead = async (id: string) => {
    const { error } = await request(`leads?id=${id}`, {
      method: "DELETE"
    });
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Lead removido" });
  };

  const addTag = async (leadId: string, tag: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.tags?.includes(tag)) return;
    const newTags = [...(lead.tags || []), tag];
    await request(`leads?id=${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ tags: newTags })
    });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, tags: newTags } : l)));
  };

  const removeTag = async (leadId: string, tag: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const newTags = (lead.tags || []).filter((t) => t !== tag);
    await request(`leads?id=${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ tags: newTags })
    });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, tags: newTags } : l)));
  };

  const handleDrop = (status: string) => {
    if (draggedId) { updateStatus(draggedId, status); setDraggedId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Arraste os leads entre as colunas. Tags automáticas da IA + manuais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
              className="bg-muted/50 rounded-xl p-3 min-h-[350px]"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                <span className="ml-auto text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{colLeads.length}</span>
              </div>

              <div className="space-y-2.5">
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
                  <p className="text-xs text-muted-foreground text-center py-10 italic">Nenhum lead</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
      className="bg-card border border-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm text-foreground">{lead.name}</p>
          {lead.handoff_requested && (
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" title="Transbordo solicitado" />
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {lead.phone && (
            <button
              onClick={() => window.open(`https://wa.me/55${lead.phone}`, "_blank")}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-success/10 text-success"
            >
              <MessageCircle size={13} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {lead.email && <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {lead.city && (
          <Badge variant="secondary" className="text-[9px]">{lead.city}</Badge>
        )}
        {(lead.tags || []).map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getTagColor(tag)}`}
          >
            <Tag size={7} />
            {tag}
            <button onClick={() => onRemoveTag(tag)} className="ml-0.5 hover:opacity-70">
              <X size={7} />
            </button>
          </span>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors opacity-0 group-hover:opacity-100">
              <Plus size={10} className="text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-3" align="start">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Adicionar Tag</p>
            <div className="flex gap-1 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nova tag..."
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleAddTag}>
                <Plus size={12} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.keys(TAG_COLORS).map((tag) => (
                <button
                  key={tag}
                  onClick={() => onAddTag(tag)}
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity ${getTagColor(tag)}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {lead.qualification_score != null && lead.qualification_score > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${lead.qualification_score}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-muted-foreground">{lead.qualification_score}</span>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2">
        {format(new Date(lead.created_at), "dd MMM · HH:mm", { locale: ptBR })}
      </p>
    </div>
  );
};

export default CRM;
