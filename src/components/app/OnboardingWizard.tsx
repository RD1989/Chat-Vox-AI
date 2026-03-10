import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Sparkles, Link2, ArrowRight, ArrowLeft, Check, Zap, PartyPopper, Copy,
  Palette, UserCheck, ShoppingBag, Terminal, Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { ChatThemeSelector, type ChatTheme } from "@/components/settings/ChatThemeSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

const OnboardingWizard = ({ userId, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Agent State
  const [aiName, setAiName] = useState("Meu Primeiro Assistente");
  const [welcomeMessage, setWelcomeMessage] = useState("Olá! Sou o assistente virtual. Como posso ajudar você hoje?");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Personality State
  const [voiceTone, setVoiceTone] = useState("Direto, cordial e focado em converter.");
  const [priorities, setPriorities] = useState("Responder rápido, qualificar o lead e oferecer a melhor solução.");

  // Design State
  const [chatTheme, setChatTheme] = useState("whatsapp");
  const [chatAppearanceMode, setChatAppearanceMode] = useState<"light" | "dark" | "auto">("dark");
  const [primaryColor, setPrimaryColor] = useState("#00FF9D");

  // Sales State
  const [pixKey, setPixKey] = useState("");
  const [catalogUrl, setCatalogUrl] = useState("");

  const chatUrl = `${window.location.origin}/chat/${userId}`;

  // Helper to construct system prompt based on choices
  const buildSystemPrompt = () => {
    return `[BASE_PROMPT]\nVocê é o assistente virtual de vendas. Sua missão principal é qualificar o cliente e conduzi-lo de forma eficiente para o fechamento.\n[/BASE_PROMPT]\n\n[TONE]\n${voiceTone}\n[/TONE]\n\n[PRIORITIES]\n${priorities}\n[/PRIORITIES]\n\n[RESTRICTIONS]\n- Responda de forma clara e objetiva.\n- Não invente preços, promoções ou prazos que não estão no seu conhecimento.\n- NUNCA assuma ou adivinhe informações de estoque ou descontos.\n[/RESTRICTIONS]`;
  };

  const handleFinish = async () => {
    setSaving(true);

    // Configurações Padrão de Tema
    let themeConfig = {
      name: "WhatsApp",
      headerBg: "#00a884",
      headerText: "#ffffff",
      chatBg: "#0b141a",
      userBubbleBg: "#005c4b",
      userBubbleText: "#e9edef",
      aiBubbleBg: "#1f2c34",
      aiBubbleText: "#e9edef",
      inputBg: "#2a3942",
      inputBarBg: "#1a2228",
      fontFamily: "sans-serif",
    };

    if (chatTheme === "instagram") {
      themeConfig = {
        name: "Instagram",
        headerBg: "#000000",
        headerText: "#ffffff",
        chatBg: "#000000",
        userBubbleBg: "#3797f0",
        userBubbleText: "#ffffff",
        aiBubbleBg: "#262626",
        aiBubbleText: "#ffffff",
        inputBg: "#262626",
        inputBarBg: "#000000",
        fontFamily: "system-ui, -apple-system, sans-serif",
      };
    } else if (chatTheme === "corporate") {
      themeConfig = {
        name: "Corporate",
        headerBg: "#ffffff",
        headerText: "#000000",
        chatBg: "#f8fafc",
        userBubbleBg: "#0f172a",
        userBubbleText: "#ffffff",
        aiBubbleBg: "#ffffff",
        aiBubbleText: "#0f172a",
        inputBg: "#ffffff",
        inputBarBg: "#ffffff",
        fontFamily: "Inter, sans-serif",
      };
    }

    try {
      // 1. Criar o Primeiro Agente do Usuário
      const { error: agentError } = await supabase.from("vox_agents").insert({
        user_id: userId,
        name: aiName,
        ai_avatar_url: avatarUrl || null,
        welcome_message: welcomeMessage,
        system_prompt: buildSystemPrompt(),
        primary_color: primaryColor,
        chat_theme: chatTheme,
        chat_appearance_mode: chatAppearanceMode,
        chat_theme_config: themeConfig,
        pix_key: pixKey || null,
        catalog_url: catalogUrl || null,
      } as any);

      if (agentError) throw agentError;

      // 2. Marcar onboarding_completed como true na profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as any)
        .eq("id", userId);

      if (profileError) throw profileError;

      setTimeout(() => {
        setSaving(false);
        setShowConfetti(true);
        setTimeout(() => {
          onComplete();
        }, 4000);
      }, 500);

    } catch (err: any) {
      toast({ title: "Erro na finalização", description: err.message || "Tente novamente mais tarde.", variant: "destructive" });
      setSaving(false);
    }
  };

  const steps = [
    {
      icon: UserCheck,
      title: "Identidade Visual",
      subtitle: "Dê um nome, rosto e mensagem inicial para sua IA.",
      content: (
        <div className="space-y-4">
          <AvatarUpload
            userId={userId}
            currentUrl={avatarUrl}
            onUrlChange={setAvatarUrl}
          />
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Nome do Consultor</Label>
            <Input
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              placeholder="Ex: João Silva, Sofia Assistente"
              className="h-11 text-base bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Boas-Vindas</Label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
              placeholder="Ex: Oi! Que bom te ver por aqui, o que você procura hoje?"
              className="text-sm resize-none bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10"
            />
          </div>
        </div>
      ),
      valid: aiName.trim().length > 0 && welcomeMessage.trim().length > 0,
    },
    {
      icon: Terminal,
      title: "Personalidade Mestra",
      subtitle: "Como o seu consultor vai tratar seus leads?",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Tom de Voz</Label>
            <Select value={voiceTone} onValueChange={setVoiceTone}>
              <SelectTrigger className="h-11 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10">
                <SelectValue placeholder="Selecione o tom de voz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Direto, cordial e focado em converter. Use de gatilhos de urgência, mas com elegância.">Profissional & Direto</SelectItem>
                <SelectItem value="Amigável e empático, utilizando emojis pontuais e demonstrando compreensão das dores.">Amigável & Empático (Com emojis)</SelectItem>
                <SelectItem value="Autoritário e Consultivo. Transmita confiança absoluta e recomende como um excelente especialista.">Consultivo & Especialista</SelectItem>
                <SelectItem value="Casual e descontraído. Fale como se estivesse batendo um papo com um amigo próximo.">Casual & Descontraído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Objetivo Principal do Robô</Label>
            <Textarea
              value={priorities}
              onChange={(e) => setPriorities(e.target.value)}
              rows={3}
              placeholder="Descreva aqui o foco: Ex. 'Descobrir se o cliente pode pagar e ofertar o Produto X imediatamente'."
              className="text-sm resize-none bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10"
            />
            <p className="text-[10px] text-muted-foreground">Você pode dar mais instruções na aba Agentes depois.</p>
          </div>
        </div>
      ),
      valid: voiceTone.length > 0 && priorities.trim().length > 0,
    },
    {
      icon: Palette,
      title: "Cores & Design",
      subtitle: "Dê a sua cara para o chat que o cliente irá usar.",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground">Modo de Exibição Base</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Claro" },
                { value: "dark", label: "Escuro" },
                { value: "auto", label: "Auto" }
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setChatAppearanceMode(opt.value as any)}
                  className={`flex items-center justify-center p-3 rounded-xl cursor-pointer border transition-all ${chatAppearanceMode === opt.value ? 'bg-primary/10 border-primary text-primary font-bold shadow-[0_0_10px_rgba(0,255,157,0.2)]' : 'border-border bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 font-medium'}`}
                >
                  <span className="text-sm">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Layout da Interface Móvel</Label>
            <ChatThemeSelector
              value={chatTheme as ChatTheme}
              onChange={(val) => setChatTheme(val)}
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-muted-foreground">Cor de Destaque da Marca</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-11 h-11 p-1 rounded-xl cursor-pointer bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-11 font-mono uppercase font-bold flex-1 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-center"
                placeholder="#00FF9D"
              />
            </div>
          </div>
        </div>
      ),
      valid: !!chatTheme && primaryColor.length > 3,
    },
    {
      icon: ShoppingBag,
      title: "Injeção de Vendas",
      subtitle: "A forma como a IA vai monetizar o seu negócio na prática.",
      content: (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Sua Chave PIX (Para pagamento rápido)</Label>
            <Input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Celular, CPF, CNPJ ou Aleatória"
              className="h-11 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10"
            />
            <p className="text-[10px] text-muted-foreground">A IA vai oferecer isso se o cliente confirmar a compra no ato.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Link do seu Site / Catálogo</Label>
            <Input
              value={catalogUrl}
              onChange={(e) => setCatalogUrl(e.target.value)}
              placeholder="https://seu-produto.com.br"
              className="h-11 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10"
            />
            <p className="text-[10px] text-muted-foreground">Permite que a IA envie o link da sua loja e produtos em estoque.</p>
          </div>
        </div>
      ),
      valid: true,
    },
    {
      icon: Sparkles,
      title: "O Ecossistema Vox",
      subtitle: "Sua base de inteligência foi estruturada de ponta-a-ponta.",
      content: (
        <div className="space-y-5">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent blur-xl pointer-events-none group-hover:opacity-100 transition duration-1000"></div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 relative z-10 flex items-center gap-2">
              <Link2 size={12} className="text-primary" /> Seu Link Mágico do Chat
            </p>
            <div className="flex gap-2 relative z-10">
              <Input
                value={chatUrl}
                readOnly
                className="h-11 text-xs bg-white dark:bg-black/50 font-mono text-slate-700 dark:text-white border-primary/30"
              />
              <Button
                variant="default"
                size="icon"
                className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90 text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                onClick={() => {
                  navigator.clipboard.writeText(chatUrl);
                  toast({ title: "Link copiado para a Área de Transferência!" });
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-semibold relative z-10">Use este link na sua Bio do Instagram, Linktree ou em Campanhas Patrocinadas.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
            {[
              { label: "Avatar & Nome" },
              { label: "Personalidade" },
              { label: "Design Salvo" },
              { label: "Links de Venda" },
            ].map((item, idx) => (
              <div key={item.label} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 opacity-0 animate-in fade-in slide-in-from-bottom flex-1" style={{ animationDelay: `${idx * 150}ms`, animationFillMode: "forwards" }}>
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-1">
                  <Check size={12} strokeWidth={3} />
                </div>
                <p className="text-[9px] text-slate-600 dark:text-white/60 font-bold uppercase tracking-widest">{item.label}</p>
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
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 150 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-sm mix-blend-screen"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: [
                  "hsl(var(--primary))",
                  "#00c6ff",
                  "#ff007a",
                  "#ffd700",
                  "#00fa9a",
                ][Math.floor(Math.random() * 5)],
              }}
              initial={{ top: "-10%", rotate: 0, opacity: 1 }}
              animate={{
                top: "110%",
                rotate: Math.random() * 1000,
                opacity: [1, 1, 0],
                x: (Math.random() - 0.5) * 300,
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", type: "spring", bounce: 0.5 }}
          className="text-center bg-white dark:bg-black/40 p-10 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative z-10 max-w-sm mx-4"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,157,0.4)] relative">
              <PartyPopper size={36} className="text-primary relative z-10" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Tudo Pronto!
          </h2>
          <p className="text-slate-500 dark:text-white/60 text-sm mb-6 leading-relaxed">
            Seu Consultor Virtual foi implementado com perfeição. O sistema liberará seu acesso ao Dashboard em segundos.
          </p>
          <div className="flex justify-center gap-1.5 align-center">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto"
      >
        {/* Logo */}
        <div className="text-center mb-8 flex text-center justify-center items-center flex-col">
          <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-gradient-to-br dark:from-primary dark:to-emerald-600 flex items-center justify-center mb-4 shadow-sm border border-slate-800 dark:shadow-[0_0_15px_rgba(0,255,157,0.3)]">
            <Zap size={22} className="text-white dark:text-black" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Setup Inicial Chat Vox</h1>
          <p className="text-sm text-slate-500 dark:text-white/60 mt-1 font-medium">Construa o seu Consultor IA em minutos</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 max-w-sm mx-auto">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${i < step ? "bg-primary shadow-[0_0_8px_rgba(0,255,157,0.5)]" : i === step ? "bg-primary/50 relative overflow-hidden" : "bg-slate-200 dark:bg-white/10"
                  }`}
              >
                {i === step && (
                  <div className="absolute top-0 left-0 w-1/2 h-full bg-primary rounded-full animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 lg:p-8 flex flex-col shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40"></div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex-1 flex flex-col relative z-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {(() => {
                    const Icon = steps[step].icon;
                    return <Icon size={20} className="text-primary" />;
                  })()}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Passo {step + 1} de {steps.length}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{steps[step].title}</h3>
              <p className="text-sm text-slate-500 dark:text-white/50 mb-6 font-medium leading-relaxed">{steps[step].subtitle}</p>

              <div className="flex-1">{steps[step].content}</div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-12 rounded-xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-white/5">
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!steps[step].valid}
                className="flex-[2] h-12 rounded-xl bg-primary text-black hover:bg-primary/90 font-black shadow-[0_5px_20px_rgba(0,255,157,0.3)] hover:shadow-[0_5px_25px_rgba(0,255,157,0.4)] transition-all"
              >
                Próximo Passo
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving || !steps[step].valid}
                className="flex-[2] h-12 rounded-xl bg-primary text-black hover:bg-primary/90 font-black shadow-[0_5px_20px_rgba(0,255,157,0.3)] hover:shadow-[0_5px_25px_rgba(0,255,157,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Instalando Agente...</>
                ) : (
                  <><Check size={16} /> Finalizar Implementação</>
                )}
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
          className="block mx-auto mt-6 text-xs text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white font-medium transition-colors mb-4"
        >
          Pular e configurar manualmente depois →
        </button>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
