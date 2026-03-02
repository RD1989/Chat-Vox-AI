import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const plans = [
  {
    slug: "free", name: "Free",
    monthly: { price: "R$0", period: "" },
    quarterly: { price: "R$0", period: "" },
    description: "Para testar a plataforma",
    leads: "25 leads",
    highlight: false,
    features: ["1 Chat IA ativo", "25 leads inclusos", "CRM básico", "1 widget de chat", "Painel de conversas"],
  },
  {
    slug: "starter", name: "Starter",
    monthly: { price: "R$97,90", period: "/mês" },
    quarterly: { price: "R$234,90", period: "/tri", perMonth: "R$78,30/mês" },
    description: "Para profissionais começando",
    leads: "300 leads/mês",
    highlight: false,
    features: ["1 Chat IA ativo", "Até 300 leads/mês", "CRM completo", "1 integração", "Suporte por email"],
  },
  {
    slug: "pro", name: "Pro",
    monthly: { price: "R$197,90", period: "/mês" },
    quarterly: { price: "R$474,90", period: "/tri", perMonth: "R$158,30/mês" },
    description: "Melhor custo-benefício",
    leads: "3.000 leads/mês",
    highlight: true,
    badge: "🔥 MAIS ESCOLHIDO",
    features: ["3 Chats IA ativos", "Até 3.000 leads/mês", "CRM completo", "Áudios humanizados premium", "Todas as integrações", "Suporte prioritário"],
  },
  {
    slug: "scale", name: "Scale",
    monthly: { price: "R$397,90", period: "/mês" },
    quarterly: { price: "R$954,90", period: "/tri", perMonth: "R$318,30/mês" },
    description: "Para alto volume",
    leads: "Leads ilimitados",
    highlight: false,
    features: ["Chats IA ilimitados", "Leads ilimitados", "Multi usuários", "Integração personalizada", "Suporte premium", "Gerente de conta"],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "quarterly">("quarterly");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 h-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Zap size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">Chat Vox</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[13px] h-8" onClick={() => navigate("/login")}>Entrar</Button>
            <Button size="sm" className="text-[13px] h-8 px-4" onClick={() => navigate("/signup")}>Começar Grátis</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-1.5 border border-border bg-secondary text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Planos & Preços
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-3">
              Escolha o plano <span className="text-primary">ideal</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-[14px]">
              Comece gratuitamente e escale conforme seu negócio cresce.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-secondary border border-border rounded-full p-1 mt-8">
            <button
              onClick={() => setBilling("quarterly")}
              className={`relative text-[13px] font-medium px-5 py-2 rounded-full transition-all ${
                billing === "quarterly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Trimestral
              <span className={`ml-1 text-[10px] font-bold ${billing === "quarterly" ? "text-primary-foreground/80" : "text-emerald-500"}`}>(Recomendado)</span>
            </button>
            <button
              onClick={() => setBilling("monthly")}
              className={`text-[13px] font-medium px-5 py-2 rounded-full transition-all ${
                billing === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.slug}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i}
                className={`relative flex flex-col rounded-lg border p-6 transition-all ${
                  plan.highlight
                    ? "border-primary bg-card shadow-md ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                    {(plan as any).badge || "🔥 Popular"}
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider mb-0.5">{plan.name}</h3>
                  <p className="text-[11px] text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold text-foreground">{plan[billing].price}</span>
                    {plan[billing].period && <span className="text-[13px] text-muted-foreground">{plan[billing].period}</span>}
                  </div>
                  {billing === "quarterly" && "perMonth" in plan.quarterly && plan.quarterly.perMonth && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">equivale a {plan.quarterly.perMonth}</p>
                  )}
                  <p className="text-[11px] font-medium text-primary mt-1.5">{plan.leads}</p>
                </div>

                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check size={13} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-[12px] text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate("/signup")}
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full h-9 text-[12px] font-medium"
                >
                  {plan.slug === "free" ? "Começar Grátis" : "Assinar Agora"}
                  <ArrowRight size={12} className="ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-14">
        <div className="container mx-auto px-6 text-center max-w-md">
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Dúvidas?</h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Todos os planos incluem acesso ao painel, chat IA e suporte. Mude de plano a qualquer momento.
          </p>
          <Button variant="outline" onClick={() => navigate("/")} className="h-9 px-6 text-[12px] font-medium">
            Voltar ao Início
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
