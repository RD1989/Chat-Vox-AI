import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LEAD_STATUSES } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LogOut, MessageCircle, Trash2, Users, UserPlus, CalendarCheck, Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const KANBAN_COLUMNS = [
  { status: "Novo", label: "Novos", color: "bg-blue-500" },
  { status: "Agendado", label: "Em Contato", color: "bg-amber-500" },
  { status: "Atendido", label: "Agendados", color: "bg-green-500" },
  { status: "Arquivado", label: "Arquivados", color: "bg-muted-foreground" },
];

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setLeads(data as unknown as Lead[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("leads" as any)
      .update({ status } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return;
    }

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    toast({ title: `Status → "${status}"` });
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Lead removido" });
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (status: string) => {
    if (draggedId) {
      updateStatus(draggedId, status);
      setDraggedId(null);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const newToday = leads.filter((l) => l.created_at.startsWith(today) && l.status === "Novo").length;
  const scheduled = leads.filter((l) => l.status === "Agendado").length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-semibold text-foreground">
              Joice <span className="text-primary">Ramos</span>
            </span>
            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold">
              Manager
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-xs tracking-wider uppercase">
            <LogOut size={14} className="mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: leads.length, icon: Users, color: "text-foreground" },
            { label: "Novos Hoje", value: newToday, icon: UserPlus, color: "text-primary" },
            { label: "Agendados", value: scheduled, icon: CalendarCheck, color: "text-green-600" },
            { label: "Taxa Conversão", value: leads.length ? `${Math.round((scheduled / leads.length) * 100)}%` : "0%", icon: TrendingUp, color: "text-amber-600" },
          ].map((card) => (
            <Card key={card.label} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon size={16} className={card.color} />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-serif font-semibold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Board */}
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">Pipeline de Leads</h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {KANBAN_COLUMNS.map((col) => {
                const colLeads = leads.filter((l) => l.status === col.status);
                return (
                  <div
                    key={col.status}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(col.status)}
                    className="bg-accent/50 rounded-lg p-4 min-h-[300px]"
                  >
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                      <div className={`w-2 h-2 rounded-full ${col.color}`} />
                      <span className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/70">
                        {col.label}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground font-semibold">
                        {colLeads.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      {colLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          className="bg-card border border-border rounded-md p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold text-sm text-foreground">{lead.nome}</p>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => window.open(`https://wa.me/55${lead.whatsapp}`, "_blank")}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-green-50 text-green-600"
                                title="WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>
                              <button
                                onClick={() => deleteLead(lead.id)}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-destructive"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[9px] mb-2">
                            {lead.servico_interesse}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {format(new Date(lead.created_at), "dd MMM · HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      ))}

                      {colLeads.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8 font-light italic">
                          Nenhum lead
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
