import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import equipmentImg from "@/assets/equipment.jpg";

const CTASection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-32 lg:py-44 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={equipmentImg}
          alt="Espaço Joice Ramos"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-foreground/80" />
      </div>

      {/* Marquee text */}
      <div className="absolute top-8 left-0 right-0 overflow-hidden opacity-[0.04]">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="font-serif text-[12vw] text-background font-bold mx-8 italic">
              Agende sua transformação ✦
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary mb-8 block">
              Próximo passo
            </span>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-background leading-[0.88] mb-8">
              Pronta para sua
              <br />
              <span className="text-primary italic font-light">transformação</span>
              <span className="text-primary">?</span>
            </h2>

            <p className="text-sm text-background/40 leading-[2] font-light mb-12 max-w-md mx-auto">
              Agende sua avaliação gratuita e descubra o tratamento ideal 
              para realçar a sua beleza natural.
            </p>

            <Button
              onClick={() => scrollTo("agendar")}
              className="rounded-none text-[10px] tracking-[0.2em] uppercase px-12 py-7 font-bold magnetic-btn group"
            >
              Agendar Avaliação Gratuita
              <ArrowRight size={14} className="ml-3 group-hover:translate-x-1.5 transition-transform duration-500" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
