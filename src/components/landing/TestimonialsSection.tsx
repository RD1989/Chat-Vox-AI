import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ana Beatriz",
    text: "Resultado incrível no botox! Super natural, ninguém percebe que fiz. Amo a Joice e toda a equipe!",
    treatment: "Botox & Preenchimento",
    initials: "AB",
  },
  {
    name: "Carla Mendes",
    text: "Fiz criolipólise e os resultados superaram todas as minhas expectativas. O ambiente é maravilhoso e acolhedor.",
    treatment: "Criolipólise",
    initials: "CM",
  },
  {
    name: "Patrícia Lima",
    text: "Atendimento impecável, ambiente acolhedor. Me sinto completamente segura em cada procedimento que faço.",
    treatment: "Bioestimulador",
    initials: "PL",
  },
];

const TestimonialsSection = () => (
  <section id="depoimentos" className="py-32 lg:py-44 bg-secondary relative overflow-hidden grain">
    {/* Large decorative text */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
      <span className="font-serif text-[30vw] font-bold text-secondary-foreground/[0.02] leading-none italic">
        JR
      </span>
    </div>

    <div className="container mx-auto px-6 lg:px-8 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-24"
      >
        <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary/80 mb-6 block">
          Depoimentos
        </span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-secondary-foreground leading-[0.88]">
          Quem confia,
          <br />
          <span className="text-primary italic font-light">recomenda</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`relative p-8 md:p-10 lg:p-12 ${i < testimonials.length - 1 ? "md:border-r border-secondary-foreground/8" : ""} border-b md:border-b-0 border-secondary-foreground/8`}
          >
            {/* Quote icon */}
            <Quote size={24} className="text-primary/20 mb-6" />

            {/* Avatar initials */}
            <div className="w-14 h-14 border border-primary/30 flex items-center justify-center mb-6">
              <span className="font-serif text-sm font-semibold text-primary">{t.initials}</span>
            </div>

            <div className="flex gap-0.5 mb-6">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={10} className="fill-primary text-primary" />
              ))}
            </div>

            <p className="text-secondary-foreground/50 text-sm leading-[2] mb-10 font-light italic">
              &ldquo;{t.text}&rdquo;
            </p>

            <div className="pt-6 border-t border-secondary-foreground/8">
              <p className="font-serif text-lg font-semibold text-secondary-foreground">{t.name}</p>
              <p className="text-[8px] text-primary uppercase tracking-[0.3em] mt-1.5 font-bold">{t.treatment}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
