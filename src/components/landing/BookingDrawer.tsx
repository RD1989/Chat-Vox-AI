import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Calendar, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TREATMENTS = [
  { value: "Facial", label: "Facial — Botox, Preenchimento, Lifting" },
  { value: "Corporal", label: "Corporal — Enzimas, Criolipólise" },
  { value: "Laser", label: "Laser — Endolaser, Luz Pulsada" },
  { value: "Pele", label: "Cuidados com a Pele — Peeling, Limpeza" },
  { value: "Bioestimulador", label: "Bioestimulador de Colágeno" },
];

const BookingDrawer = () => {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setStep(0);
    setName("");
    setWhatsapp("");
    setCategory("");
    setDate("");
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !whatsapp.trim() || !category) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({ title: "WhatsApp inválido", description: "Informe DDD + número", variant: "destructive" });
      return;
    }

    if (name.trim().length > 100) {
      toast({ title: "Nome muito longo", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("appointments" as any).insert([
      {
        client_name: name.trim(),
        client_whatsapp: cleanPhone,
        treatment_category: category,
        preferred_date: date || null,
        status: "pending",
      },
    ] as any);

    // Also save to leads table for CRM
    await supabase.from("leads" as any).insert([
      {
        nome: name.trim(),
        whatsapp: cleanPhone,
        servico_interesse: category,
        status: "Novo",
      },
    ] as any);

    setLoading(false);

    if (error) {
      toast({ title: "Erro ao agendar", description: "Tente novamente.", variant: "destructive" });
      return;
    }

    setSubmitted(true);
  };

  const steps = [
    {
      title: "Olá! Qual seu nome?",
      subtitle: "Vamos personalizar sua experiência.",
      content: (
        <div className="space-y-3">
          <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">
            Nome completo
          </Label>
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="h-14 rounded-none bg-background border-border text-base focus:border-primary"
            autoFocus
          />
        </div>
      ),
      valid: name.trim().length > 0,
    },
    {
      title: `Prazer, ${name.split(" ")[0] || ""}!`,
      subtitle: "Qual o melhor WhatsApp para contato?",
      content: (
        <div className="space-y-3">
          <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">
            WhatsApp
          </Label>
          <Input
            placeholder="(21) 99999-9999"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            maxLength={15}
            className="h-14 rounded-none bg-background border-border text-base focus:border-primary"
            autoFocus
          />
        </div>
      ),
      valid: whatsapp.replace(/\D/g, "").length >= 10,
    },
    {
      title: "O que deseja melhorar?",
      subtitle: "Selecione a categoria do tratamento.",
      content: (
        <div className="space-y-4">
          <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">
            Tratamento
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-14 rounded-none bg-background border-border text-sm">
              <SelectValue placeholder="Escolha um tratamento" />
            </SelectTrigger>
            <SelectContent>
              {TREATMENTS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-3 pt-2">
            <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">
              Data preferida (opcional)
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-14 rounded-none bg-background border-border text-sm focus:border-primary"
            />
          </div>
        </div>
      ),
      valid: category.length > 0,
    },
  ];

  return (
    <>
      {/* Fixed floating button */}
      <div id="agendar" className="fixed bottom-8 right-8 z-40">
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 300); }}>
          <SheetTrigger asChild>
            <Button className="rounded-none px-8 py-6 text-[11px] tracking-[0.15em] uppercase font-bold shadow-2xl shadow-primary/30 group">
              <Calendar size={16} className="mr-2" />
              Agendar Avaliação
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md border-l border-border bg-card p-0 flex flex-col">
            <SheetHeader className="p-8 pb-4 border-b border-border">
              <SheetTitle className="font-serif text-2xl font-semibold">
                {submitted ? "Tudo certo!" : "Sua Avaliação"}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {submitted ? "Entraremos em contato em breve." : `Passo ${step + 1} de ${steps.length}`}
              </SheetDescription>
              {/* Progress bar */}
              {!submitted && (
                <div className="flex gap-1 mt-4">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 transition-colors duration-300 ${
                        i <= step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              )}
            </SheetHeader>

            <div className="flex-1 p-8 flex flex-col">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center gap-6"
                  >
                    <div className="w-16 h-16 bg-primary flex items-center justify-center">
                      <Check size={28} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                        Solicitação enviada!
                      </h3>
                      <p className="text-sm text-muted-foreground font-light leading-relaxed">
                        {name.split(" ")[0]}, nossa equipe entrará em contato pelo WhatsApp para confirmar sua avaliação.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => { setOpen(false); setTimeout(reset, 300); }}
                      className="rounded-none border-foreground/20 text-[11px] tracking-[0.1em] uppercase mt-4"
                    >
                      Fechar
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col"
                  >
                    <h3 className="font-serif text-xl font-semibold text-foreground mb-1">
                      {steps[step].title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-8">
                      {steps[step].subtitle}
                    </p>

                    <div className="flex-1">{steps[step].content}</div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-border">
                      {step > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setStep(step - 1)}
                          className="rounded-none text-[11px] tracking-[0.1em] uppercase border-foreground/20 flex-1"
                        >
                          Voltar
                        </Button>
                      )}
                      {step < steps.length - 1 ? (
                        <Button
                          onClick={() => setStep(step + 1)}
                          disabled={!steps[step].valid}
                          className="rounded-none text-[11px] tracking-[0.1em] uppercase flex-1"
                        >
                          Continuar
                          <ArrowRight size={14} className="ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmit}
                          disabled={!steps[step].valid || loading}
                          className="rounded-none text-[11px] tracking-[0.1em] uppercase flex-1"
                        >
                          {loading ? "Enviando..." : "Confirmar"}
                          <Check size={14} className="ml-2" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default BookingDrawer;
