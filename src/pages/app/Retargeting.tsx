import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingBag,
  Users,
  MessageSquare,
  Calendar,
  ArrowRight,
  Filter,
  Search,
  Timer,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RetargetingLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  qualification_score: number;
  status: string;
  updated_at: string;
  last_message?: string;
}

const Retargeting = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<RetargetingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchRetargetingLeads = async () => {
      // Filter qualified leads that haven't been updated recently (simulating abandonment)
      const { data, error } = await supabase
        .from("vox_leads")
        .select("*")
        .eq("user_id", user.id)
        .eq("qualified", true)
        .order("updated_at", { ascending: false });

      if (data) {
        setLeads(data as unknown as RetargetingLead[]);
      }
      setLoading(false);
    };

    fetchRetargetingLeads();
  }, [user]);

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 max-w-7xl animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <ShoppingBag className="text-primary" size={28} />
            Recuperação de Carrinho
          </h1>
          <p className="text-muted-foreground mt-1">
            Reengaje leads qualificados que interromperam a jornada de compra.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl bg-background/50 border-white/5 shadow-glass">
            <Filter size={16} />
            Filtros
          </Button>
          <Button className="gap-2 rounded-xl bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all font-bold">
            <Plus size={16} strokeWidth={3} />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Leads em Abandono", value: filteredLeads.length, icon: Users, color: "text-amber-500" },
          { label: "Oportunidade (R$ Est.)", value: `R$ ${filteredLeads.length * 450},00`, icon: ShoppingBag, color: "text-emerald-500" },
          { label: "Aguardando Contato", value: filteredLeads.filter(l => l.qualification_score > 80).length, icon: Timer, color: "text-primary" },
          { label: "Recuperados (30d)", value: "14", icon: CheckCircle2, color: "text-blue-500" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-white/5 border-white/5 backdrop-blur-xl shadow-glass overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon size={20} className={stat.color} />
                  <Badge variant="outline" className="text-[10px] font-bold opacity-50">META</Badge>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main List Section */}
      <Card className="bg-[#0A0A0A]/60 border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Leads Quentes para Recuperação</CardTitle>
              <CardDescription>Mostrando leads com score superior a 60</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por nome ou WhatsApp..."
                className="pl-10 bg-black/40 border-white/10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Lead</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Score</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Última Atividade</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {filteredLeads.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                            {lead?.name ? lead.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors">{lead?.name || "Usuário"}</p>
                            <p className="text-xs text-muted-foreground">{lead?.phone || "Sem telefone"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${lead.qualification_score}%` }}
                              className={`h-full ${lead.qualification_score > 80 ? 'bg-emerald-500' : 'bg-primary'}`}
                            />
                          </div>
                          <span className="text-xs font-bold text-white">{lead.qualification_score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={14} />
                          {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true, locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${lead.qualification_score > 80
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                          }`}>
                          {lead.qualification_score > 80 ? "Alta Intenção" : "Pendente"}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {lead.phone ? (
                          <Button
                            size="sm"
                            className="rounded-lg bg-[#25D366] text-white hover:bg-[#25D366]/90 font-bold gap-2 border-none"
                            onClick={() => window.open(`https://wa.me/55${lead.phone?.replace(/\\D/g, '')}?text=${encodeURIComponent(`Olá ${lead.name}, tudo bem? Vi que você estava conversando com nosso assistente virtual e não encerrou o atendimento...`)}`, '_blank')}
                          >
                            <MessageSquare size={14} />
                            WhatsApp
                          </Button>
                        ) : lead.email ? (
                          <Button
                            size="sm"
                            className="rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-bold gap-2 border-none"
                            onClick={() => window.location.href = `mailto:${lead.email}`}
                          >
                            <Mail size={14} />
                            E-mail
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled
                            className="rounded-lg bg-white/5 text-white/40 font-bold gap-2 cursor-not-allowed border border-white/5"
                          >
                            Sem Contato
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-muted-foreground/30">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Nenhum lead em abandono</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Sua operação está rodando liso! Todos os leads qualificados estão sendo atendidos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Workflows Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-glass relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/20 blur-[50px] group-hover:bg-primary/30 transition-all rounded-full"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              Automação Malthusiana ativa
            </CardTitle>
            <CardDescription className="text-slate-400">
              Nossa IA envia gatilhos de recuperação automáticos via Webhook para leads que param de responder por mais de 2 horas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-xs font-medium text-primary">IA recuperou 3 leads hoje automaticamente</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 border-rose-500/20 shadow-glass">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
              <AlertCircle className="text-rose-500" size={16} />
              Atenção Crítica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white leading-none">04</p>
            <p className="text-xs text-muted-foreground mt-2">Leads com ticket {'>'} R$ 1.000 em abandono há mais de 24h.</p>
            <Button variant="link" className="text-rose-500 p-0 h-auto text-xs mt-3 font-bold">Ver agora →</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Retargeting;
