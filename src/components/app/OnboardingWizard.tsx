import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Sparkles, Link2, ArrowRight, ArrowLeft, Check, Zap, PartyPopper, Copy,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

const OnboardingWizard = ({ userId, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [aiName, setAiName] = useState("ChatVox");
  const [welcomeMessage, setWelcomeMessage] = useState("Olá! Como posso ajudar você hoje?");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [saving, setSaving] = useState(false);

  const chatUrl = `${window.location.origin}/chat/${userId}`;

  const handleFinish = async () => {
    setSaving(true);

    // Save vox_settings
    await supabase.from("vox_settings").upsert(
      {
        user_id: userId,
        ai_name: aiName,
        welcome_message: welcomeMessage,
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_id" }
    );

    // Mark onboarding complete
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true } as any)
      .eq("id", userId);

    setSaving(false);
    setShowConfetti(true);

    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  const steps = [
    {
      icon: Bot,
      title: "Configure seu agente IA",
      subtitle: "Dê um nome e personalidade ao seu vendedor virtual.",
      content: (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Nome da IA</Label>
            <Input
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              placeholder="Ex: Vendedor IA, Assistente, Sofia..."
              className="h-12 text-base"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Mensagem de Boas-Vindas</Label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              placeholder="A primeira mensagem que o lead verá ao abrir o chat"
              className="text-sm"
            />
          </div>
        </div>
      ),
      valid: aiName.trim().length > 0,
    },
    {
      icon: Sparkles,
      title: "Treine sua IA",
      subtitle: "Descreva seu produto/serviço para a IA saber como vender.",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Instruções da IA (System Prompt)</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder={`Exemplo:\nVocê é a assistente da Clínica XYZ.\nSeu objetivo é qualificar leads e agendar consultas.\nNossos serviços: Botox (R$800), Preenchimento (R$1200).\nSempre pergunte sobre o interesse e orçamento do lead.`}
              className="text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Opcional — você pode configurar depois em Configurações.
            </p>
          </div>
        </div>
      ),
      valid: true,
    },
    {
      icon: Link2,
      title: "Compartilhe seu link",
      subtitle: "Pronto! Copie o link e coloque no seu tráfego pago.",
      content: (
        <div className="space-y-5">
          <div className="bg-secondary/50 border border-border rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Link do seu Chat IA</p>
            <div className="flex gap-2">
              <Input
                value={chatUrl}
                readOnly
                className="h-11 text-sm bg-background font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(chatUrl);
                  toast({ title: "Link copiado!" });
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { emoji: "📱", label: "Bio do Instagram" },
              { emoji: "🎯", label: "Tráfego Pago" },
              { emoji: "📩", label: "Email Marketing" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-3">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      valid: true,
    },
  ];

  if (showConfetti) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center">
        {/* Confetti particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: [
                  "hsl(var(--primary))",
                  "hsl(var(--warning))",
                  "hsl(var(--info))",
                  "hsl(var(--destructive))",
                  "hsl(var(--success))",
                ][i % 5],
              }}
              initial={{ top: "-5%", rotate: 0, opacity: 1 }}
              animate={{
                top: "110%",
                rotate: Math.random() * 720,
                opacity: [1, 1, 0],
                x: (Math.random() - 0.5) * 200,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <PartyPopper size={64} className="text-primary mx-auto mb-6" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-foreground mb-3">
            Tudo pronto! 🎉
          </h2>
          <p className="text-muted-foreground text-base max-w-sm mx-auto">
            Seu chat IA está configurado e pronto para converter leads. Boas vendas!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Zap size={22} className="text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Bem-vindo ao ChatVox</h1>
          <p className="text-xs text-muted-foreground mt-1">Configure seu chat IA em 3 passos simples</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-2xl p-7 min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {(() => {
                    const Icon = steps[step].icon;
                    return <Icon size={20} className="text-primary" />;
                  })()}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Passo {step + 1} de {steps.length}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">{steps[step].title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{steps[step].subtitle}</p>

              <div className="flex-1">{steps[step].content}</div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-border">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-11 rounded-xl">
                <ArrowLeft size={14} className="mr-1" />
                Voltar
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!steps[step].valid}
                className="flex-1 h-11 rounded-xl"
              >
                Continuar
                <ArrowRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 h-11 rounded-xl"
              >
                {saving ? "Salvando..." : "Finalizar Setup"}
                <Check size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={async () => {
            await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("id", userId);
            onComplete();
          }}
          className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular configuração →
        </button>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
