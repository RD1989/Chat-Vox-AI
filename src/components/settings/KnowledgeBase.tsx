import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, BookOpen, Check, X, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface KnowledgeBaseProps {
  userId: string;
  agentId?: string;
}

const CATEGORIES = ["geral", "serviços", "preços", "horários", "FAQ", "políticas"];

export const KnowledgeBase = ({ userId, agentId }: KnowledgeBaseProps) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "geral" });

  const fetchEntries = async () => {
    let query = supabase
      .from("vox_knowledge" as any)
      .select("*")
      .eq("user_id", userId);

    if (agentId) {
      query = query.eq("agent_id", agentId);
    } else {
      query = query.is("agent_id", null);
    }

    const { data } = await query.order("created_at", { ascending: false });
    if (data) setEntries(data as unknown as KnowledgeEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [userId]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }
    setSaving(true);

    let embedding = null;
    try {
      const { data: embedData, error: embedError } = await supabase.functions.invoke('vox-embedder', {
        body: { text: form.content }
      });
      if (!embedError && embedData?.embedding) {
        embedding = embedData.embedding;
      }
    } catch (e) {
      console.error("Failed to generate embedding, falling back to text-only:", e);
    }

    if (editingId) {
      const { error } = await supabase
        .from("vox_knowledge" as any)
        .update({
          title: form.title,
          content: form.content,
          category: form.category,
          embedding: embedding,
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", editingId);
      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Entrada atualizada!" });
      }
    } else {
      const { error } = await supabase
        .from("vox_knowledge" as any)
        .insert({
          user_id: userId,
          agent_id: agentId || null,
          title: form.title,
          content: form.content,
          category: form.category,
          embedding: embedding
        } as any);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Entrada adicionada!" });
      }
    }

    setSaving(false);
    setForm({ title: "", content: "", category: "geral" });
    setShowForm(false);
    setEditingId(null);
    fetchEntries();
  };

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    try {
      const { data, error } = await supabase.functions.invoke('vox-crawler', {
        body: { url: crawlUrl, user_id: userId, agent_id: agentId }
      });
      if (error) throw error;
      toast({ title: "Crawl concluído!", description: "O conhecimento foi extraído e adicionado." });
      setCrawlUrl("");
      fetchEntries();
    } catch (e: any) {
      toast({ title: "Erro no Crawl", description: e.message, variant: "destructive" });
    } finally {
      setCrawling(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from("vox_knowledge" as any)
      .update({ is_active: !current } as any)
      .eq("id", id);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, is_active: !current } : e)));
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("vox_knowledge" as any).delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Entrada removida" });
  };

  const startEdit = (entry: KnowledgeEntry) => {
    setForm({ title: entry.title, content: entry.content, category: entry.category });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const charCount = entries.reduce((acc, e) => acc + e.content.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BookOpen size={13} /> {entries.length} entradas
        </span>
        <span>~{Math.round(charCount / 4)} tokens estimados</span>
        <span className={charCount > 15000 ? "text-destructive font-semibold" : ""}>
          {charCount > 15000 ? "⚠️ Limite próximo" : "✓ Dentro do limite"}
        </span>
      </div>

      {/* Add/Edit Form */}
      {showForm ? (
        // ... Card content (unchanged basically, but I'll skip for brevity if possible, but actually I need to maintain it)
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {editingId ? "Editar Entrada" : "Nova Entrada"}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setShowForm(false); setEditingId(null); setForm({ title: "", content: "", category: "geral" }); }}
              >
                <X size={14} />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Horário de funcionamento"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Conteúdo</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={5}
                placeholder="Descreva informações que a IA deve saber sobre este tópico..."
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground text-right">{form.content.length} caracteres</p>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
              {editingId ? "Atualizar" : "Adicionar"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="text-xs flex-1 sm:flex-none">
            <Plus size={14} className="mr-1" /> Adicionar Manualmente
          </Button>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Treinar via URL (ex: https://site.com/faq)"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              className="h-8 text-[11px] bg-accent/20 border-primary/20"
            />
            <Button
              size="sm"
              onClick={handleCrawl}
              disabled={crawling || !crawlUrl}
              className="h-8 text-[10px] font-bold gap-1 bg-primary text-black hover:bg-primary/90"
            >
              {crawling ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              CRAWL & LEARN
            </Button>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id} className={`border-border/50 ${!entry.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{entry.title}</p>
                    <Badge variant="secondary" className="text-[9px] shrink-0">{entry.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={entry.is_active}
                    onCheckedChange={() => toggleActive(entry.id, entry.is_active)}
                    className="scale-75"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(entry)}>
                    <Pencil size={12} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEntry(entry.id)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 italic">
            Nenhuma entrada na base de conhecimento. Adicione informações sobre seu negócio para a IA responder melhor.
          </p>
        )}
      </div>
    </div>
  );
};
