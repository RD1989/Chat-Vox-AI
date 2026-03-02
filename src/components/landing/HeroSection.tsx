import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import heroSpa from "@/assets/hero-spa.jpg";
import { useRef } from "react";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 0.3]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen overflow-hidden grain">
      <div className="grid md:grid-cols-[1fr_1.1fr] min-h-screen">
        {/* Left — Editorial Copy */}
        <div className="relative flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-32 md:py-0 bg-background z-10">
          {/* Decorative elements */}
          <div className="absolute top-20 left-8 lg:left-16 w-16 h-16 border-l border-t border-primary/20" />
          <div className="absolute bottom-20 right-8 lg:right-16 w-12 h-12 border-r border-b border-primary/10" />

          {/* Vertical label */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 vertical-text text-[9px] tracking-[0.4em] uppercase text-muted-foreground/40 font-bold hidden xl:block"
          >
            Biomedicina Estética ✦ Since 2010
          </motion.span>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              variants={fadeUp}
              className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary/80 mb-10 block"
            >
              Biomedicina & Estética Avançada
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-semibold leading-[0.85] tracking-[-0.02em] text-foreground mb-10"
            >
              Beleza que
              <br />
              <span className="text-primary italic font-light">transforma</span>
              <br />
              <span className="text-foreground/40 font-extralight text-[0.6em] tracking-normal">
                de dentro pra fora
              </span>
            </motion.h1>

            <motion.div variants={fadeUp} className="editorial-line-left w-20 mb-8" />

            <motion.p
              variants={fadeUp}
              className="text-[13px] text-muted-foreground leading-[2] max-w-[340px] mb-12 font-light"
            >
              Há mais de 14 anos unindo ciência, tecnologia e sensibilidade
              para resultados que respeitam a sua essência.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => scrollTo("agendar")}
                className="rounded-none text-[10px] tracking-[0.2em] uppercase px-10 py-7 font-bold magnetic-btn group"
              >
                Agendar Avaliação
                <ArrowRight size={14} className="ml-3 group-hover:translate-x-1.5 transition-transform duration-500" />
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollTo("servicos")}
                className="rounded-none text-[10px] tracking-[0.2em] uppercase px-10 py-7 font-bold border-foreground/15 text-foreground/50 hover:border-primary hover:text-primary bg-transparent magnetic-btn"
              >
                Ver Tratamentos
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-12 mt-20 pt-8 border-t border-border/60"
          >
            {[
              { num: "14+", label: "Anos de excelência" },
              { num: "5K+", label: "Clientes atendidos" },
              { num: "10", label: "Tratamentos premium" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.15, duration: 0.6 }}
              >
                <p className="font-serif text-3xl lg:text-4xl font-semibold text-primary tracking-tight">{s.num}</p>
                <p className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/60 mt-2 font-bold">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right — Full image with parallax */}
        <div className="relative hidden md:block overflow-hidden">
          <motion.div
            style={{ y: imageY }}
            className="absolute inset-0 -top-[10%] -bottom-[10%]"
          >
            <motion.img
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              src={heroSpa}
              alt="Espaço Joice Ramos - Estética avançada"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </motion.div>
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/30 z-[2]" />
          <motion.div
            style={{ opacity: overlayOpacity }}
            className="absolute inset-0 bg-foreground z-[2]"
          />

          {/* Floating location badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-12 right-12 z-10 bg-background/95 backdrop-blur-xl px-7 py-5 border border-border/50"
          >
            <p className="font-serif text-lg font-semibold text-foreground tracking-wide">Nova Iguaçu, RJ</p>
            <p className="text-[8px] tracking-[0.4em] uppercase text-primary mt-1.5 font-bold">Agende sua visita →</p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-12 left-12 z-10 flex flex-col items-center gap-3"
          >
            <span className="text-[8px] tracking-[0.3em] uppercase text-background/50 font-bold vertical-text">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown size={14} className="text-background/40" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
