import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  BarChart3,
  MessageSquare,
  Users,
  Shield,
  Clock,
  Bot,
  Smartphone,
  Palette,
  Lock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Bell,
  Columns3,
  Headphones,
  Rocket,
  Play,
  Star,
  TrendingUp,
  MousePointerClick,
  ArrowUpRight,
  Tag,
  GripVertical,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import ChatPreview from "@/components/landing/ChatPreview";
import { useRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const platforms = [
  { name: "Hotmart", color: "#FF6B00", icon: "🔥" },
  { name: "Braip", color: "#2563EB", icon: "b" },
  { name: "PerfectPay", color: "#8B5CF6", icon: "P" },
  { name: "Kiwify", color: "#22C55E", icon: "K" },
  { name: "Monetizze", color: "#059669", icon: "M" },
  { name: "Eduzz", color: "#3B82F6", icon: "E" },
  { name: "Ticto", color: "#F43F5E", icon: "T" },
  { name: "Greenn", color: "#10B981", icon: "G" },
];

const whatsappProblems = [
  "Risco de bloqueio a qualquer momento",
  "Só vende quando você está online",
  "Impossível escalar — depende de pessoas",
  "Leads esfriam esperando resposta",
  "Sem métricas reais de conversão",
  "Limite de mensagens e broadcasts",
];

const voxSolutions = [
  "Zero risco de bloqueio — seu link, suas regras",
  "Vende 24h por dia, 7 dias por semana",
  "Escala infinita — atenda 1 ou 10.000 leads",
  "Resposta instantânea — lead nunca esfria",
  "Métricas detalhadas de conversão",
  "Taxa de conversão média de +70%",
];

const features = [
  {
    icon: MessageSquare,
    title: "Chat estilo WhatsApp",
    description: "Interface familiar que seus leads já conhecem. Conversas naturais com IA que parecem humanas.",
  },
  {
    icon: Bot,
    title: "Leads no automático",
    description: "Gere um link, coloque no tráfego pago e a IA faz o resto. Captura leads 24h sem parar.",
  },
  {
    icon: BarChart3,
    title: "Dashboard completa",
    description: "Acompanhe conversas ao vivo, total de leads e métricas de conversão em tempo real.",
  },
  {
    icon: Smartphone,
    title: "Funciona em qualquer dispositivo",
    description: "Chat responsivo que funciona perfeitamente no celular, tablet e desktop.",
  },
  {
    icon: Palette,
    title: "Personalização total",
    description: "Customize nome do agente, avatar, mensagens e comportamento da IA para sua marca.",
  },
  {
    icon: Lock,
    title: "Dados seguros",
    description: "Seus dados e conversas protegidos com criptografia e infraestrutura enterprise.",
  },
];

const premiumFeatures = [
  {
    icon: Bell,
    badge: "Novo",
    title: "Notificações Push",
    description: "Receba alertas instantâneos no navegador quando um lead quente é qualificado. Nunca perca uma oportunidade — mesmo longe do painel.",
    color: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: Columns3,
    badge: "Pipeline",
    title: "Kanban com Tags",
    description: "Gerencie seus leads com pipeline visual drag-and-drop. Tags automáticas geradas pela IA organizam por temperatura, interesse e urgência.",
    color: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: Headphones,
    badge: "Live Chat",
    title: "Transbordo Humano",
    description: "Quando a IA não resolve, o lead é transferido automaticamente para um atendente humano no painel. Zero lead perdido.",
    color: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    icon: Rocket,
    badge: "Onboarding",
    title: "Onboarding Guiado",
    description: "Configure tudo em 3 passos com um wizard intuitivo. Barra de progresso, dicas contextuais e confetti ao finalizar. Setup em 5 minutos.",
    color: "from-purple-500/20 to-purple-600/5",
  },
];

const steps = [
  { number: "01", title: "Crie sua conta", description: "Cadastre-se gratuitamente e configure seu produto em minutos." },
  { number: "02", title: "Personalize a IA", description: "Defina o tom, avatar e mensagens do seu agente virtual." },
  { number: "03", title: "Compartilhe o link", description: "Coloque no tráfego pago, redes sociais ou onde quiser." },
  { number: "04", title: "Converta no automático", description: "A IA qualifica e direciona leads quentes para compra." },
];

const stats = [
  { value: "10K+", label: "Leads capturados" },
  { value: "500+", label: "Chats ativos" },
  { value: "70%", label: "Taxa de conversão" },
  { value: "24/7", label: "Disponibilidade" },
];

const testimonials = [
  {
    metric: "+216%",
    metricLabel: "em vendas",
    text: "Eu respondia lead por lead no WhatsApp e perdia 60% deles. Com o Chat Vox, minha IA responde na hora e já converte direto. Saí de R$12k pra R$38k/mês.",
    name: "Ricardo M.",
    role: "Infoprodutor • Mentoria",
    photo: "/testimonials/ricardo.jpg",
  },
  {
    metric: "+189%",
    metricLabel: "em receita",
    text: "Vendia no x1 pelo WhatsApp e vivia com o celular na mão. Agora o chat IA faz o atendimento e eu só acompanho as vendas caindo na conta.",
    name: "Camila T.",
    role: "Infoprodutora • Curso Online",
    photo: "/testimonials/camila.jpg",
  },
  {
    metric: "+70%",
    metricLabel: "em conversão",
    text: "Meu funil mandava 200 leads/dia e eu só conseguia atender 30. Com o Chat Vox atendo todos no automático e minha conversão subiu 70%.",
    name: "Thiago A.",
    role: "Infoprodutor • High Ticket",
    photo: "/testimonials/thiago.jpg",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "quarterly">("quarterly");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Chat Vox</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <button onClick={() => navigate("/pricing")} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Preços
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[13px] h-8" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button size="sm" className="text-[13px] h-8 px-4 rounded-lg" onClick={() => navigate("/signup")}>
              Aumente suas vendas
              <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="container mx-auto px-6 pt-20 sm:pt-28 pb-8 text-center relative">
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 border border-primary/20 bg-primary/[0.06] text-primary text-[12px] font-semibold px-4 py-1.5 rounded-full mb-8"
          >
            <Sparkles size={13} />
            Chat IA que vende no automático
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] font-extrabold text-foreground leading-[1.08] max-w-4xl mx-auto tracking-tight"
          >
            Seu funil manda lead mas o seu
            <br className="hidden sm:block" />
            atendimento{" "}
            <span className="text-primary relative">
              não aguenta escala
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none"><path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.3" /></svg>
            </span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-muted-foreground mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Crie um chat inteligente que conversa como uma pessoa real, entende seu produto e convence seus leads a comprar — 24 horas por dia, 7 dias por semana.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9"
          >
            <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
              Criar meu Chat IA
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary" />
              Escala garantida
            </span>
          </motion.div>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="flex items-center justify-center gap-6 mt-8 text-[12px] text-muted-foreground"
          >
            {[
              { icon: Shield, label: "SSL Seguro" },
              { icon: Clock, label: "Setup em 5 min" },
              { icon: Bot, label: "IA avançada" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <item.icon size={13} className="text-primary/70" />
                {item.label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ INTEGRATIONS MARQUEE ═══════════════ */}
      <section className="py-14 overflow-hidden border-y border-border bg-secondary/30">
        <div className="container mx-auto px-6 text-center mb-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">Integrações</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Conectado com as maiores plataformas de{" "}
              <span className="text-primary">infoprodutos</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Rastreie suas vendas automaticamente. Configure o webhook e veja cada venda em tempo real.
            </p>
          </motion.div>
        </div>

        {/* Infinite scroll logos */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex animate-marquee-slow gap-6">
            {[...platforms, ...platforms].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex-shrink-0 flex items-center gap-2.5 px-6 py-3 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all cursor-default"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.icon}
                </div>
                <span className="text-sm font-semibold text-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PROBLEM VS SOLUTION ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-[11px] font-semibold text-destructive/80 uppercase tracking-[0.2em] mb-2">O problema que ninguém fala</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Pare de depender do WhatsApp para{" "}
              <span className="text-primary">vender</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-[15px]">
              Enquanto você depende do WhatsApp, está limitado a vender apenas quando está online. E pior: a qualquer momento, sua conta pode ser <strong className="text-foreground">bloqueada</strong>.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {/* WhatsApp column */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="border border-border rounded-2xl p-7 bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-destructive/30" />
              <div className="flex items-center gap-2 mb-1.5">
                <XCircle size={16} className="text-destructive" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Manual</p>
              </div>
              <p className="text-[13px] text-muted-foreground mb-6">O jeito antigo de vender</p>
              <ul className="space-y-3">
                {whatsappProblems.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[14px] text-muted-foreground">
                    <XCircle size={15} className="text-destructive/60 mt-0.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Chat Vox column */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="border-2 border-primary/30 rounded-2xl p-7 bg-primary/[0.02] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={16} className="text-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-wider">A solução</p>
              </div>
              <p className="text-[13px] font-medium text-foreground mb-6">Chat Vox IA — Escale sem limites</p>
              <ul className="space-y-3">
                {voxSolutions.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-[14px] text-foreground">
                    <CheckCircle2 size={15} className="text-primary mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="text-center mt-10">
            <p className="text-sm text-muted-foreground mb-4">
              Chega de perder vendas por depender do WhatsApp
            </p>
            <Button size="lg" onClick={() => navigate("/signup")} className="h-11 px-8 text-sm font-semibold rounded-xl">
              Quero escalar minhas vendas
              <ArrowRight size={14} className="ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FEATURES GRID ═══════════════ */}
      <section className="border-y border-border bg-secondary/30 py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">Recursos</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Tudo que você precisa para{" "}
              <span className="text-primary">vender mais</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="border border-border rounded-2xl p-6 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-[15px] font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PREMIUM FEATURES (NOVIDADES) ═══════════════ */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-[11px] font-bold px-4 py-1.5 rounded-full mb-4">
              <Sparkles size={12} />
              FUNCIONALIDADES PREMIUM
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Ferramentas que seus{" "}
              <span className="text-primary">concorrentes</span>
              <br className="hidden sm:block" />
              não têm
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-[15px]">
              Recursos exclusivos que colocam o Chat Vox anos à frente de qualquer ferramenta do mercado.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto mt-14">
            {premiumFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative border border-border rounded-2xl p-8 bg-card hover:border-primary/40 transition-all duration-300 group overflow-hidden"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <f.icon size={22} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="border-y border-border bg-secondary/20 py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-6">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">Como funciona</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Seu vendedor IA no{" "}
              <span className="text-primary">bolso dos seus clientes</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-[15px]">
              O Chat Vox cria uma experiência de chat idêntica ao WhatsApp. Seu lead abre o link, conversa com a IA e é guiado até a compra — tudo no automático.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto mt-14 items-center">
            {/* Steps */}
            <div className="space-y-1">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="flex items-start gap-5 p-5 rounded-2xl hover:bg-card hover:border hover:border-border transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <span className="font-mono text-sm font-bold text-primary group-hover:text-primary-foreground">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chat Preview */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
              <ChatPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ DASHBOARD PREVIEW ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">Painel de Controle</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Acompanhe tudo em{" "}
              <span className="text-primary">tempo real</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-[15px]">
              Dashboard completa com métricas de leads, conversas ativas e performance do seu chat IA.
            </p>
          </motion.div>

          {/* Mock Dashboard */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-5xl mx-auto border border-border rounded-2xl bg-card overflow-hidden shadow-2xl shadow-foreground/5">
            {/* Dashboard header bar */}
            <div className="border-b border-border px-6 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-secondary rounded-lg px-4 py-1 text-[11px] text-muted-foreground font-mono">
                  chatvox.app/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 sm:p-8">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total de Leads", value: "1.248", change: "+12%", icon: Users },
                  { label: "Conversas Ativas", value: "38", change: "+5%", icon: MessageSquare },
                  { label: "Taxa de Conversão", value: "34%", change: "+8%", icon: TrendingUp },
                  { label: "Mensagens Hoje", value: "892", change: "+22%", icon: MousePointerClick },
                ].map((stat) => (
                  <div key={stat.label} className="bg-secondary/50 border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                      <stat.icon size={14} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <span className="text-[11px] font-semibold text-primary">{stat.change}</span>
                  </div>
                ))}
              </div>

              {/* Chart placeholder */}
              <div className="bg-secondary/30 border border-border rounded-xl p-6 h-44 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
                    className="flex-1 bg-primary/20 rounded-t-md hover:bg-primary/40 transition-colors relative group"
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ KANBAN PREVIEW ═══════════════ */}
      <section className="border-y border-border bg-secondary/20 py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">CRM Pipeline</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Gerencie leads com{" "}
              <span className="text-primary">visão completa</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-[15px]">
              Pipeline Kanban com drag-and-drop, tags automáticas da IA e transbordo humano integrado.
            </p>
          </motion.div>

          {/* Mock Kanban */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-5xl mx-auto overflow-x-auto pb-4">
            <div className="grid grid-cols-4 gap-4 min-w-[700px]">
              {[
                {
                  title: "Novos", count: 12, color: "bg-blue-500", leads: [
                    { name: "João Silva", tag: "Quente", tagColor: "text-destructive bg-destructive/10" },
                    { name: "Maria Santos", tag: "Orgânico", tagColor: "text-primary bg-primary/10" },
                  ]
                },
                {
                  title: "Qualificados", count: 8, color: "bg-amber-500", leads: [
                    { name: "Pedro Costa", tag: "High Ticket", tagColor: "text-warning bg-warning/10" },
                  ]
                },
                {
                  title: "Em Atendimento", count: 5, color: "bg-emerald-500", leads: [
                    { name: "Ana Souza", tag: "Live Chat", tagColor: "text-info bg-info/10" },
                    { name: "Carlos Lima", tag: "Follow-up", tagColor: "text-muted-foreground bg-secondary" },
                  ]
                },
                {
                  title: "Vendas", count: 23, color: "bg-primary", leads: [
                    { name: "Fernanda Alves", tag: "Convertido", tagColor: "text-primary bg-primary/10" },
                  ]
                },
              ].map((col) => (
                <div key={col.title} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.title}</span>
                    <span className="ml-auto text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{col.count}</span>
                  </div>
                  <div className="space-y-2.5">
                    {col.leads.map((lead) => (
                      <div key={lead.name} className="bg-secondary/50 border border-border rounded-xl p-3.5 cursor-grab hover:shadow-md transition-all group">
                        <div className="flex items-center gap-1.5 mb-2">
                          <GripVertical size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                          <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lead.tagColor}`}>
                          <Tag size={8} className="inline mr-1" />
                          {lead.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">Resultados Reais</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Empresas que escalaram vendas com o{" "}
              <span className="text-primary">Chat Vox</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-[15px]">
              Nossos clientes aumentam as conversões em até 70% com o chat IA — sem equipe de vendas, sem complicação.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="border border-border rounded-2xl p-7 bg-card hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                {/* Metric */}
                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-primary">{t.metric}</span>
                  <span className="text-sm text-muted-foreground ml-2">{t.metricLabel}</span>
                </div>

                {/* Quote */}
                <p className="text-[14px] text-muted-foreground leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-border">
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social proof strip */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-3xl mx-auto mt-14 text-center">
            <div className="inline-flex items-center gap-4 bg-primary/[0.06] border border-primary/20 rounded-2xl px-8 py-5">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-primary">+70%</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">de aumento médio nas conversões</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <p className="text-[12px] text-muted-foreground max-w-[200px]">
                Dados reais de clientes Chat Vox nos últimos 6 meses
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ STATS STRIP ═══════════════ */}
      <section className="border-y border-border bg-primary/[0.03]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="py-10 text-center"
              >
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{s.value}</p>
                <p className="text-[12px] text-muted-foreground mt-1.5 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-4">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">Planos</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Escolha o plano ideal para o seu{" "}
              <span className="text-primary">negócio</span>
            </h2>
          </motion.div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="text-muted-foreground text-center text-[15px] mb-8 max-w-md mx-auto">
            Comece a vender no automático com IA. Cancele quando quiser.
          </motion.p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-14">
            <div className="inline-flex items-center bg-secondary border border-border rounded-full p-1">
              <button
                onClick={() => setBilling("quarterly")}
                className={`relative text-[13px] font-medium px-5 py-2 rounded-full transition-all ${billing === "quarterly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Trimestral
                <span className={`ml-1 text-[10px] font-bold ${billing === "quarterly" ? "text-primary-foreground/80" : "text-emerald-500"}`}>(Recomendado)</span>
              </button>
              <button
                onClick={() => setBilling("monthly")}
                className={`text-[13px] font-medium px-5 py-2 rounded-full transition-all ${billing === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Mensal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {/* Starter */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="border border-border rounded-2xl p-7 bg-card flex flex-col">
              <h3 className="text-base font-bold text-foreground">Starter</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5 mb-6">Ideal para testar</p>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-foreground">{billing === "monthly" ? "R$97,90" : "R$234,90"}</span>
                <span className="text-muted-foreground text-sm">{billing === "monthly" ? "/mês" : "/tri"}</span>
              </div>
              {billing === "quarterly" && <p className="text-[11px] text-muted-foreground mb-5">equivale a R$78,30/mês</p>}
              {billing === "monthly" && <div className="mb-5" />}
              <ul className="space-y-2.5 mb-8 flex-1">
                {["300 leads/mês", "1 agente IA", "CRM básico", "Dashboard de métricas", "Suporte por email"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-muted-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-11 text-sm font-semibold rounded-xl" onClick={() => navigate("/signup")}>
                Começar Grátis
              </Button>
            </motion.div>

            {/* Pro */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="border-2 border-primary rounded-2xl p-7 bg-card flex flex-col relative shadow-lg shadow-primary/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1 rounded-full flex items-center gap-1">
                🔥 Mais escolhido
              </span>
              <h3 className="text-base font-bold text-foreground">Pro</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5 mb-6">Para escalar vendas</p>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-foreground">{billing === "monthly" ? "R$197,90" : "R$474,90"}</span>
                <span className="text-muted-foreground text-sm">{billing === "monthly" ? "/mês" : "/tri"}</span>
              </div>
              {billing === "quarterly" && <p className="text-[11px] text-muted-foreground mb-5">equivale a R$158,30/mês</p>}
              {billing === "monthly" && <div className="mb-5" />}
              <ul className="space-y-2.5 mb-8 flex-1">
                {["2.000 leads/mês", "3 agentes IA", "CRM completo", "Métricas avançadas", "Pixels Meta & TikTok", "Transbordo humano", "Suporte prioritário"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-11 text-sm font-semibold rounded-xl" onClick={() => navigate("/signup")}>
                Começar Agora
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </motion.div>

            {/* Scale */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="border border-border rounded-2xl p-7 bg-card flex flex-col">
              <h3 className="text-base font-bold text-foreground">Scale</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5 mb-6">Alto volume</p>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-foreground">{billing === "monthly" ? "R$397,90" : "R$954,90"}</span>
                <span className="text-muted-foreground text-sm">{billing === "monthly" ? "/mês" : "/tri"}</span>
              </div>
              {billing === "quarterly" && <p className="text-[11px] text-muted-foreground mb-5">equivale a R$318,30/mês</p>}
              {billing === "monthly" && <div className="mb-5" />}
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Leads ilimitados", "Agentes ilimitados", "CRM + API", "Relatórios exportáveis", "White-label", "Notificações push", "Suporte VIP"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-muted-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-11 text-sm font-semibold rounded-xl" onClick={() => navigate("/signup")}>
                Falar com Vendas
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT THE AUTHOR ═══════════════ */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-secondary/10">
        <div className="container mx-auto px-6 relative">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Author Image with decoration */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="relative w-[280px] sm:w-[320px] lg:w-[400px] shrink-0"
            >
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50 pointer-events-none" />
              <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl">
                <img
                  src="/idealizador.png"
                  alt="O Idealizador"
                  className="w-full h-full object-cover"
                />
                {/* Decorative overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-card border border-primary/30 p-4 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Rocket size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-foreground">10+ Anos</p>
                    <p className="text-[11px] text-muted-foreground">de Experiência</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content / Storytelling */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="flex-1"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-[11px] font-bold px-4 py-1.5 rounded-full mb-6 text-center lg:text-left">
                <Users size={12} />
                O CÉREBRO POR TRÁS DA ESTRATÉGIA
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-8 text-center lg:text-left">
                De programador a especialista em
                <span className="text-primary block">Conversão Digital</span>
              </h2>

              <div className="space-y-6 text-muted-foreground text-[16px] leading-relaxed text-center lg:text-left">
                <p>
                  Com mais de <strong>10 anos de experiência</strong> como desenvolvedor e especialista em sistemas web, acompanhei de perto a evolução do mercado digital e as dores de quem tenta escalar vendas todos os dias.
                </p>
                <p>
                  A sacada para o <strong>Chat Vox AI</strong> surgiu de uma dor real: o excesso de bloqueios e banimentos do WhatsApp que travam o faturamento de milhares de negócios. Como profissional de marketing digital, eu via operações inteiras pararem por causa de um chip bloqueado.
                </p>
                <p>
                  Eu sabia que precisávamos de uma solução que unisse a <strong>familiaridade do WhatsApp</strong> com a <strong>segurança de uma plataforma própria</strong>. Foi assim que desenvolvi um sistema que não apenas automatiza conversas, mas protege sua operação, permitindo escala real sem o medo constante de perder seus números.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 text-center lg:text-left">
                  <CheckCircle2 size={18} className="text-primary mx-auto lg:mx-0 mb-2" />
                  <p className="text-sm font-bold text-foreground">Sistemas Web</p>
                  <p className="text-[12px] text-muted-foreground">Arquitetura Escalável</p>
                </div>
                <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 text-center lg:text-left">
                  <TrendingUp size={18} className="text-primary mx-auto lg:mx-0 mb-2" />
                  <p className="text-sm font-bold text-foreground">Marketing Digital</p>
                  <p className="text-[12px] text-muted-foreground">Foco em ROI e Escala</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-primary/10 to-transparent pointer-events-none" />

        <div className="container mx-auto px-6 relative text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              Pronto para vender no{" "}
              <span className="text-primary">automático</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-[15px]">
              Crie seu chat IA agora e comece a converter visitantes em clientes — sem precisar de equipe.
            </p>
            <Button size="lg" onClick={() => navigate("/signup")} className="h-13 px-10 text-base font-bold rounded-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
              Aumente suas vendas
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <p className="text-[12px] text-muted-foreground mt-5 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1"><Shield size={11} /> Sem cartão</span>
              <span className="flex items-center gap-1"><Clock size={11} /> Setup em 5 min</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Cancele quando quiser</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-border py-8 bg-secondary/20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Zap size={11} className="text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">Chat Vox</span>
            </div>
            <span className="text-[12px] text-muted-foreground">
              © 2026 Chat Vox. Todos os direitos reservados. Feito no Brasil 🇧🇷
            </span>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/privacidade")} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </button>
              <button onClick={() => navigate("/exclusao-dados")} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                Exclusão de Dados
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
