import { useState, useRef } from "react";
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
  TrendingUp,
  MousePointerClick,
  Tag,
  GripVertical,
  PlayCircle,
  Star
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import ChatPreview from "@/components/landing/ChatPreview";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] },
  }),
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
    title: "Mobile First",
    description: "Chat responsivo que funciona perfeitamente no celular, onde 90% dos seus leads estão.",
  },
  {
    icon: Palette,
    title: "Personalização total",
    description: "Customize nome do agente, avatar, cores e comportamento da IA para sua marca.",
  },
  {
    icon: Lock,
    title: "Infraestrutura Segura",
    description: "Seus dados protegidos. Construído para suportar picos de tráfego de grandes lançamentos.",
  },
];

const premiumFeatures = [
  {
    icon: Bell,
    badge: "Novo",
    title: "Notificações Push",
    description: "Receba alertas instantâneos no navegador quando um lead quente é qualificado. Nunca perca uma oportunidade — mesmo longe do painel.",
    gradient: "from-blue-500/20 to-transparent",
    border: "group-hover:border-blue-500/50",
    iconColor: "text-blue-400"
  },
  {
    icon: Columns3,
    badge: "Pipeline",
    title: "Kanban Inteligente",
    description: "Gerencie seus leads com pipeline visual drag-and-drop. Tags automáticas da IA organizam por temperatura, interesse e urgência.",
    gradient: "from-amber-500/20 to-transparent",
    border: "group-hover:border-amber-500/50",
    iconColor: "text-amber-400"
  },
  {
    icon: Headphones,
    badge: "Live Chat",
    title: "Transbordo Humano",
    description: "Quando a IA não resolve ou o lead pede, a conversa é transferida automaticamente para o painel. Assuma o controle na hora do fechamento.",
    gradient: "from-emerald-500/20 to-transparent",
    border: "group-hover:border-emerald-500/50",
    iconColor: "text-emerald-400"
  },
  {
    icon: Rocket,
    badge: "Onboarding",
    title: "Setup em 5 Minutos",
    description: "Configure tudo em 3 passos com nosso wizard guiado pela IA. Basta dizer o que você vende e a IA cria as instruções perfeitamente.",
    gradient: "from-purple-500/20 to-transparent",
    border: "group-hover:border-purple-500/50",
    iconColor: "text-purple-400"
  },
];

const steps = [
  { number: "01", title: "Crie sua conta", description: "Acesso imediato ao painel. Sem cartão de crédito." },
  { number: "02", title: "Treine a IA em minutos", description: "Basta colar o link da sua página de vendas ou um PDF." },
  { number: "03", title: "Compartilhe seu Link", description: "Use na bio do Instagram, tráfego pago ou onde quiser." },
  { number: "04", title: "Venda no automático", description: "A IA qualifica os leads e envia o link de checkout na hora certa." },
];

const stats = [
  { value: "10K+", label: "Leads Capturados" },
  { value: "500+", label: "IA's Ativas" },
  { value: "70%", label: "Taxa de Conversão" },
  { value: "R$ 2M+", label: "Em Vendas Geradas" },
];

const testimonials = [
  {
    metric: "+216%",
    metricLabel: "em vendas",
    text: "Mudei do WhatsApp pro ChatVox e minha vida mudou. Não me preocupo mais com bloqueios de chip e a IA vende melhor que minha equipe antiga.",
    name: "Ricardo M.",
    role: "Produtor PPL",
    photo: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  },
  {
    metric: "12x",
    metricLabel: "mais leads",
    text: "Eu estava perdendo muito dinheiro com leads frios. A IA do Chat Vox qualifica todo mundo instantaneamente e só me passa quem quer comprar o High Ticket.",
    name: "Camila T.",
    role: "Mentora de Negócios",
    photo: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  },
  {
    metric: "+70%",
    metricLabel: "conversão",
    text: "O chat carrega rápido, parece o WhatsApp e a IA tem uma naturalidade absurda. Tive meu melhor lançamento mês passado usando o ChatVox como frente.",
    name: "Thiago A.",
    role: "Estrategista Digital",
    photo: "https://i.pravatar.cc/150?u=a04258114e29026702d",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "quarterly">("quarterly");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, 50]);

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden text-slate-300">

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between h-16 px-6 lg:px-12">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">ChatVox</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#solucao" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Solução</a>
            <a href="#recursos" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Recursos</a>
            <a href="#depoimentos" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Resultados</a>
            <a href="#planos" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-[13px] font-medium text-slate-300 hover:text-white transition-colors">
              Login
            </button>
            <Button size="sm" onClick={() => navigate("/signup")} className="h-9 px-4 rounded-lg bg-white text-black hover:bg-slate-200 font-semibold text-[13px] transition-all hidden sm:flex">
              Criar Conta
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
        {/* Deep Space Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] opacity-30 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] opacity-30 pointer-events-none" />

        {/* Subtle Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="container mx-auto px-6 relative z-10 text-center">

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="inline-flex items-center justify-center mb-8 relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-indigo-500/30 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative inline-flex items-center gap-2 bg-[#111]/80 backdrop-blur-md border border-white/10 text-slate-300 text-[12px] font-medium px-4 py-1.5 rounded-full overflow-hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Novo: IA atualizada para versão 3.1 com Raciocínio Premium
              <ChevronRight size={12} className="text-slate-500 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-[5rem] font-bold text-white tracking-[-0.04em] leading-[1.05] max-w-5xl mx-auto drop-shadow-sm">
            O fim da sua dependência do <br className="hidden md:block" />
            <span className="relative whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              WhatsApp para vender
            </span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg sm:text-xl text-slate-400 mt-8 max-w-2xl mx-auto leading-relaxed font-light">
            Crie um agente virtual inteligente que conversa, qualifica e vende para seus leads <strong className="text-white font-medium">24h por dia</strong>. Escala infinita, zero risco de bloqueio, taxa de conversão surreal.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button size="lg" onClick={() => navigate("/signup")} className="h-14 px-8 text-[15px] font-semibold rounded-xl bg-white text-black hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-300 w-full sm:w-auto">
              Testar Gratuitamente
              <ArrowRight size={18} className="ml-2 opacity-70" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-[15px] font-medium rounded-xl border-white/10 text-white hover:bg-white/5 bg-[#111]/50 backdrop-blur-sm w-full sm:w-auto">
              <PlayCircle size={18} className="mr-2 text-primary" />
              Ver Demonstração
            </Button>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mt-12 flex items-center justify-center gap-6 text-[12px] text-slate-500 font-medium tracking-wide uppercase">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary/70" /> Sem Cartão de Crédito</span>
            <span className="flex items-center gap-1.5 hidden sm:flex"><CheckCircle2 size={14} className="text-primary/70" /> Setup em 2 Minutos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary/70" /> Cancele quando quiser</span>
          </motion.div>

        </motion.div>
      </section>

      {/* ═══════════════ LOGO CLOUD ═══════════════ */}
      <section className="py-12 border-y border-white/5 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <p className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-[0.3em] mb-8">
            PERFEITO PARA PRODUTORES DESTAS PLATAFORMAS
          </p>
          <div className="relative flex overflow-hidden w-full py-2">
            <div className="flex animate-marquee-slow whitespace-nowrap min-w-full justify-around gap-12">
              {platforms.map(p => (
                <div key={p.name} className="flex items-center gap-2 group cursor-default mx-4">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-[12px] font-bold text-white transition-transform group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: p.color }}>{p.icon}</div>
                  <span className="font-semibold text-lg text-slate-300 group-hover:text-white transition-colors">{p.name}</span>
                </div>
              ))}
              {/* Duplicate array for seamless infinite marquee loop */}
              {platforms.map(p => (
                <div key={`${p.name}-dup`} className="flex items-center gap-2 group cursor-default mx-4">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-[12px] font-bold text-white transition-transform group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: p.color }}>{p.icon}</div>
                  <span className="font-semibold text-lg text-slate-300 group-hover:text-white transition-colors">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ METRICS BANNER ═══════════════ */}
      <section className="py-20 bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="bg-[#111] border border-white/5 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-indigo-500/10 opacity-50" />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center px-4">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-[12px] sm:text-[13px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PROBLEM X SOLUTION ═══════════════ */}
      <section id="solucao" className="py-24 relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
              Vender pelo WhatsApp é a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500">pior escolha</span> para escalar seu negócio.
            </h2>
            <p className="text-lg text-slate-400">
              Ou você sofre com bloqueios constantes, ou paga milhares de reais em plataformas complexas que no fim, exigem atendentes humanos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* The Old Way */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-8 sm:p-10 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-rose-500/50" />
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle size={20} className="text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">WhatsApp Manual</h3>
                </div>
                <ul className="space-y-4">
                  {whatsappProblems.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle size={18} className="text-red-400/70 shrink-0 mt-0.5" />
                      <span className="text-[15px] text-slate-400">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* The New Way */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-primary/30 rounded-3xl p-8 sm:p-10 relative group overflow-hidden shadow-2xl shadow-primary/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-500" />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                    <Sparkles size={20} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Ecossistema ChatVox</h3>
                </div>
                <ul className="space-y-4">
                  {voxSolutions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-primary/90 shrink-0 mt-0.5" />
                      <span className="text-[15px] text-slate-300 font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ AUTHOR / FOUNDER SECTION ═══════════════ */}
      <section className="py-24 border-y border-white/5 relative overflow-hidden bg-[#0a0a0a]">
        {/* Glow behind author */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-50" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Image Side */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="w-full lg:w-1/2">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-purple-500/30 rounded-3xl transform rotate-3 scale-105 blur-xl opacity-60" />
                <img
                  src="/rodrigo_gomes.png"
                  alt="Rodrigo Gomes - Criador do ChatVox"
                  className="relative w-full h-full object-cover rounded-3xl border border-white/10 shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-[#111] border border-white/10 p-5 rounded-2xl shadow-xl backdrop-blur-xl">
                  <div className="flex gap-1 mb-2">
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                  </div>
                  <p className="text-white font-bold text-lg">"O Fim dos Bloqueios"</p>
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider mt-1">Visão do Fundador</p>
                </div>
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="w-full lg:w-1/2 pt-8 lg:pt-0">
              <p className="text-primary font-bold tracking-widest text-[11px] uppercase mb-3">Conheça o Criador</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-[1.1]">
                Construído por quem vive o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">campo de batalha</span> diariamente.
              </h2>
              <div className="space-y-4 text-slate-400 text-[15px] leading-relaxed mb-8">
                <p>
                  "Como desenvolvedor há mais de 10 anos, cheguei a um ponto onde não aguentava mais as operações travarem. Nós perdemos muito tempo e dinheiro com o enorme número de bloqueios de contas de WhatsApp em lançamentos e perpétuos."
                </p>
                <p>
                  Foi aí que tive essa grande sacada. O ChatVox nasceu não apenas como um chatbot bacana, mas sim como a solução definitiva e independente para escalar as vendas e qualificação do seu x1.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:block w-12 h-px bg-white/20" />
                <div>
                  <p className="text-white font-bold text-lg">Rodrigo Gomes</p>
                  <p className="text-slate-500 text-sm">Desenvolvedor & Fundador, ChatVox</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PREMIUM FEATURES ═══════════════ */}
      <section id="recursos" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
              Ecossistema <span className="text-primary">Premium</span>
            </h2>
            <p className="text-lg text-slate-400">
              Muito além de um chat. Uma plataforma completa de conversão e CRM construída para operações milionárias.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {premiumFeatures.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className={`bg-[#0a0a0a] border border-white/5 ${f.border} rounded-3xl p-8 transition-colors duration-500 relative group overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-[#111] border border-white/5 flex items-center justify-center shadow-lg ${f.iconColor}`}>
                      <f.icon size={22} />
                    </div>
                    {f.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-slate-400 text-[14px] leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ DASHBOARD PREVIEW & CHAT PREVIEW ═══════════════ */}
      <section className="py-24 border-y border-white/5 bg-[#080808] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-stretch max-w-6xl mx-auto">

            {/* Dashboard Side */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="w-full lg:w-[60%] flex flex-col">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Controle total na <br /><span className="text-primary">Ponta dos Dedos</span></h2>
                <p className="text-slate-400 text-lg">Analise conversões, acompanhe o funil no CRM Kanban e assuma conversas quentes no Live Chat.</p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl flex-1 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

                {/* Fake UI */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div className="flex gap-4">
                    <div className="w-24 h-2 rounded bg-white/10" />
                    <div className="w-16 h-2 rounded bg-white/5" />
                    <div className="w-20 h-2 rounded bg-white/5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/20" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                    <div className="text-slate-400 text-[11px] font-medium mb-1">Conversão</div>
                    <div className="text-white font-bold text-xl md:text-2xl">72%</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500" />
                    <div className="text-slate-400 text-[11px] font-medium mb-1">Leads Ativos</div>
                    <div className="text-white font-bold text-xl md:text-2xl">4.289</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500" />
                    <div className="text-slate-400 text-[11px] font-medium mb-1">Qualificados</div>
                    <div className="text-white font-bold text-xl md:text-2xl">890</div>
                  </div>
                </div>

                <div className="bg-[#151515] rounded-xl border border-white/5 p-4 flex gap-4 h-full">
                  <div className="w-1/3 space-y-3">
                    <div className="w-full h-8 rounded bg-white/10" />
                    <div className="w-full h-16 rounded bg-white/5" />
                    <div className="w-full h-16 rounded bg-white/5" />
                  </div>
                  <div className="w-2/3 flex flex-col">
                    <div className="flex-1 bg-white/[0.02] rounded-lg mb-3 border border-white/5 p-3 flex flex-col justify-end gap-2">
                      <div className="w-3/4 h-6 rounded-lg rounded-tl-none bg-white/10" />
                      <div className="w-1/2 h-6 rounded-lg rounded-tr-none bg-primary/20 self-end" />
                    </div>
                    <div className="h-10 rounded bg-white/5 border border-white/5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Chat Side */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="w-full lg:w-[40%]">
              <div className="h-full w-full max-w-[400px] mx-auto scale-95 lg:scale-100 transform origin-top shadow-[0_0_80px_rgba(var(--primary),0.15)] rounded-[40px] border-[8px] border-[#1a1a1a] bg-black relative">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />
                <div className="overflow-hidden rounded-[32px] h-[800px] relative bg-background">
                  <ChatPreview />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="planos" className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.3em] mb-4">Investimento</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
              Preços simples, sem surpresas.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Custo de software muito menor do que o salário de um atendente humano que dorme à noite.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <p className="text-slate-400 text-sm mb-6">Para quem está começando a escalar.</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">R$ 97</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["500 Leads /mês", "1 Agente IA", "Histórico de 30 dias", "Suporte Padrão"].map((i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300">
                    <CheckCircle2 size={16} className="text-primary shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/signup")} className="w-full bg-white text-black hover:bg-slate-200 h-12 rounded-xl text-sm font-semibold">Assinar Starter</Button>
            </motion.div>

            {/* Pro */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-primary/40 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-primary/10">
              <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Mais Escolhido</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-primary">Pro 🚀</h3>
              <p className="text-slate-400 text-sm mb-6">Para produtos em operação constante.</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">R$ 197</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["2.000 Leads /mês", "3 Agentes IA (Múltiplos produtos)", "Remover Branding", "CRM Kanban Avançado", "Suporte Prioritário"].map((i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] text-slate-200 font-medium">
                    <CheckCircle2 size={16} className="text-primary shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/signup")} className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl text-[15px] font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)]">Inicie o Plano Pro</Button>
            </motion.div>

            {/* Scale */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2} className="bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Scale Black</h3>
              <p className="text-slate-400 text-sm mb-6">Para players grandes e agências.</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">R$ 497</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Leads Ilimitados", "Agentes Ilimitados", "Integração via API", "Webhooks Avancados", "Gerenciador de Contas Dedicado"].map((i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300">
                    <CheckCircle2 size={16} className="text-white shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/signup")} variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/5 h-12 rounded-xl text-sm font-semibold">Assinar Scale</Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL FOOTER CTA ═══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20" />
        <div className="absolute inset-0 bg-[#050505] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_80%)]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Pronto para colocar sua operação <br />no <span className="text-primary">piloto automático</span>?
          </h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto">Junte-se a centenas de produtores que pararam de sofrer com atendimentos manuais e bloqueios no WhatsApp.</p>
          <Button size="lg" onClick={() => navigate("/signup")} className="h-14 px-10 text-[15px] font-bold rounded-xl bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all">
            Criar Minha Máquina de Vendas
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050505] py-12 border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap size={14} className="text-primary" />
            <span className="font-bold text-white text-lg">ChatVox</span>
          </div>
          <p className="text-slate-500 text-sm mb-4">© 2026 ChatVox IA. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-6 text-sm text-slate-400">
            <a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a>
            <a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
