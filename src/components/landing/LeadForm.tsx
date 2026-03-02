import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SERVICES } from "@/types/lead";
import { ArrowRight } from "lucide-react";

const LeadForm = () => {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [servico, setServico] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !whatsapp.trim() || !servico) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    if (nome.trim().length > 100) {
      toast({ title: "Nome muito longo", variant: "destructive" });
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({ title: "WhatsApp inválido", description: "Informe DDD + número", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("leads" as any).insert([
      { nome: nome.trim(), whatsapp: cleanPhone, servico_interesse: servico, status: "Novo" },
    ] as any);

    setLoading(false);

    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
      return;
    }

    toast({ title: "Solicitação Recebida!", description: "Entraremos em contato em breve pelo WhatsApp." });
    setNome("");
    setWhatsapp("");
    setServico("");
  };

  return (
    <section id="agendar" className="py-32 bg-background relative">
      {/* Decorative corner */}
      <div className="absolute top-16 right-8 md:right-16 w-24 h-24 border-r border-t border-primary/10" />

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] font-medium tracking-[0.4em] uppercase text-primary block mb-4">
              Agendamento
            </span>
            <h2 className="text-4xl md:text-5xl font-medium text-foreground leading-[0.95] mb-6">
              Sua jornada
              <br />
              <span className="text-primary italic font-normal">começa aqui</span>
            </h2>
            <div className="gold-line w-12 mb-8" />
            <p className="text-foreground/40 leading-relaxed font-light mb-10 text-sm">
              Preencha o formulário e nossa equipe entrará em contato
              pelo WhatsApp para agendar sua avaliação personalizada —
              sem compromisso.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { num: "14+", label: "Anos" },
                { num: "5k+", label: "Clientes" },
                { num: "100%", label: "Seguro" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-3xl font-medium text-primary">{s.num}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="border border-border bg-card p-8 md:p-10">
              <h3 className="font-serif text-xl font-medium text-foreground mb-1 tracking-wide">
                Avaliação Gratuita
              </h3>
              <p className="text-xs text-muted-foreground mb-8">
                100% personalizada. Sem compromisso.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-[10px] uppercase tracking-[0.2em] font-medium text-foreground/50">
                    Nome completo
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={100}
                    className="h-12 bg-background border-border rounded-none focus:border-primary text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-[10px] uppercase tracking-[0.2em] font-medium text-foreground/50">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    placeholder="(21) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    maxLength={15}
                    className="h-12 bg-background border-border rounded-none focus:border-primary text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.2em] font-medium text-foreground/50">
                    Tratamento
                  </Label>
                  <Select value={servico} onValueChange={setServico}>
                    <SelectTrigger className="h-12 bg-background border-border rounded-none text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full h-13 py-4 text-[11px] tracking-[0.2em] uppercase font-medium rounded-none border border-primary bg-primary text-primary-foreground hover:bg-transparent hover:text-primary transition-all duration-500"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Solicitar Avaliação"}
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LeadForm;
