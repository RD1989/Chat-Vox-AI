import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Syringe, Gem, Sparkles, Snowflake, Zap, Sun, ScanFace, Leaf, Layers, Droplets, ArrowUpRight } from "lucide-react";
import clinicInterior from "@/assets/clinic-interior.jpg";
import equipmentImg from "@/assets/equipment.jpg";
import beautyProducts from "@/assets/beauty-products.jpg";

const services = [
  { icon: Syringe, title: "Botox", category: "Facial", desc: "Suavize linhas de expressão com naturalidade e precisão absoluta.", image: clinicInterior },
  { icon: Gem, title: "Preenchimento", category: "Facial", desc: "Volume e contorno facial com ácido hialurônico de última geração.", image: equipmentImg },
  { icon: Sparkles, title: "Enzimas", category: "Corporal", desc: "Reduza gordura localizada de forma rápida, segura e eficaz.", image: beautyProducts },
  { icon: Snowflake, title: "Criolipólise", category: "Corporal", desc: "Elimine gordura com congelamento controlado e sem cirurgia.", image: clinicInterior },
  { icon: Zap, title: "Endolaser", category: "Laser", desc: "Tecnologia a laser para firmeza e rejuvenescimento profundo.", image: equipmentImg },
  { icon: Sun, title: "Luz Pulsada", category: "Laser", desc: "Tratamento avançado para manchas, vasos e fotoenvelhecimento.", image: beautyProducts },
  { icon: ScanFace, title: "Lifting", category: "Facial", desc: "Efeito lifting sem cirurgia para uma pele mais jovem e firme.", image: clinicInterior },
  { icon: Leaf, title: "Bioestimulador", category: "Facial", desc: "Estimule colágeno natural para firmeza duradoura e radiante.", image: equipmentImg },
  { icon: Layers, title: "Peeling", category: "Facial", desc: "Renove a textura da pele com peelings profissionais.", image: beautyProducts },
  { icon: Droplets, title: "Limpeza de Pele", category: "Facial", desc: "Pele renovada, profundamente limpa e hidratada.", image: clinicInterior },
];

const ServicesSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 420;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section id="servicos" className="py-32 lg:py-44 bg-background overflow-hidden relative">
      {/* Large background number */}
      <div className="absolute top-16 right-8 lg:right-16 pointer-events-none select-none">
        <span className="font-serif text-[20vw] font-bold text-foreground/[0.015] leading-none">
          10
        </span>
      </div>

      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="grid md:grid-cols-2 gap-8 mb-20 items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary/80 mb-6 block">
              Tratamentos
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-foreground leading-[0.88]">
              Uma galeria de
              <br />
              <span className="text-primary italic font-light">possibilidades</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-end justify-between md:justify-end gap-6"
          >
            <p className="text-xs text-muted-foreground font-light max-w-[220px] hidden md:block leading-[1.9]">
              Deslize para explorar todos os nossos procedimentos especializados.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-12 h-12 border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all duration-500 magnetic-btn"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-12 h-12 border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all duration-500 magnetic-btn"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Horizontal scroll gallery */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x-mandatory pl-6 lg:pl-8 pr-6 pb-6 scrollbar-hide"
      >
        {services.map((svc, i) => (
          <motion.div
            key={svc.title}
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.04, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 w-[300px] md:w-[360px] group cursor-pointer"
          >
            {/* Image container */}
            <div className="relative overflow-hidden aspect-[3/4] mb-6">
              <img
                src={svc.image}
                alt={svc.title}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.06] transition-all duration-[800ms] ease-out"
                loading="lazy"
              />
              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600" />

              {/* Category badge */}
              <div className="absolute top-5 left-5 bg-background/95 backdrop-blur-sm px-3 py-1.5">
                <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-primary">{svc.category}</span>
              </div>

              {/* Bottom hover content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <p className="text-xs text-background/80 leading-relaxed font-light mb-4">{svc.desc}</p>
                <div className="flex items-center gap-2 text-background/60">
                  <span className="text-[9px] tracking-[0.2em] uppercase font-bold">Saiba mais</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>

              {/* Icon overlay */}
              <div className="absolute top-5 right-5 w-11 h-11 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400 scale-75 group-hover:scale-100">
                <svc.icon size={18} className="text-primary-foreground" />
              </div>
            </div>

            {/* Text */}
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-400">
                {svc.title}
              </h3>
              <ArrowUpRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors duration-400 mt-1.5" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ServicesSection;
