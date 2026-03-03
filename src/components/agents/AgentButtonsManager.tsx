import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Link as LinkIcon, Loader2, Save, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AgentButton {
    id: string;
    agent_id: string;
    label: string;
    url: string;
    description: string;
    is_active: boolean;
}

interface AgentButtonsManagerProps {
    agentId: string;
}

export const AgentButtonsManager = ({ agentId }: AgentButtonsManagerProps) => {
    const [buttons, setButtons] = useState<AgentButton[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newButton, setNewButton] = useState({ label: "", url: "", description: "" });

    const fetchButtons = useCallback(async () => {
        const { data, error } = await (supabase
            .from("vox_agent_buttons" as any)
            .select("*") as any)
            .eq("agent_id", agentId)
            .order("created_at");

        if (error) {
            toast({ title: "Erro ao carregar links", description: error.message, variant: "destructive" });
        } else {
            setButtons((data as AgentButton[]) || []);
        }
        setLoading(false);
    }, [agentId]);

    useEffect(() => {
        fetchButtons();
    }, [fetchButtons]);

    const handleAdd = async () => {
        if (!newButton.label || !newButton.url) {
            toast({ title: "Campos obrigatórios", description: "O rótulo e a URL são necessários.", variant: "destructive" });
            return;
        }

        setSaving(true);
        const { data, error } = await (supabase
            .from("vox_agent_buttons" as any)
            .insert({
                agent_id: agentId,
                label: newButton.label,
                url: newButton.url,
                description: newButton.description,
            } as any)
            .select()
            .single() as any);

        setSaving(false);
        if (error) {
            toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
        } else if (data) {
            setButtons(prev => [...prev, data as AgentButton]);
            setNewButton({ label: "", url: "", description: "" });
            toast({ title: "Link estratégico adicionado!" });
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await (supabase
            .from("vox_agent_buttons" as any)
            .delete()
            .eq("id", id) as any);

        if (error) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        } else {
            setButtons(prev => prev.filter(b => b.id !== id));
            toast({ title: "Link removido." });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-black/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Rótulo do Botão</Label>
                        <Input
                            value={newButton.label}
                            onChange={e => setNewButton({ ...newButton, label: e.target.value })}
                            placeholder="Ex: Falar com Consultor"
                            className="bg-white dark:bg-black/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">URL de Destino</Label>
                        <Input
                            value={newButton.url}
                            onChange={e => setNewButton({ ...newButton, url: e.target.value })}
                            placeholder="https://wa.me/..."
                            className="bg-white dark:bg-black/20"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Descrição/Contexto (Para a IA)</Label>
                    <Input
                        value={newButton.description}
                        onChange={e => setNewButton({ ...newButton, description: e.target.value })}
                        placeholder="Use este botão quando o cliente quiser fechar a compra ou falar com um humano."
                        className="bg-white dark:bg-black/20"
                    />
                </div>
                <Button onClick={handleAdd} disabled={saving} className="w-full bg-primary text-black font-bold gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    ADICIONAR LINK ESTRATÉGICO
                </Button>
            </div>

            <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <LinkIcon size={16} className="text-primary" /> Links Ativos do Agente
                </h4>
                {buttons.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-white/40 italic">Nenhum link cadastrado para este agente.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {buttons.map((btn) => (
                            <Card key={btn.id} className="bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tighter">{btn.label}</span>
                                            <ExternalLink size={12} className="text-slate-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate">{btn.url}</p>
                                        {btn.description && (
                                            <p className="text-[10px] text-primary/70 mt-1 italic line-clamp-1">{btn.description}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(btn.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
