import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import clinicInterior from "@/assets/clinic-interior.jpg";
import beautyProducts from "@/assets/beauty-products.jpg";

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imgY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);
  const imgY2 = useTransform(scrollYProgress, [0, 1], ["-3%", "8%"]);

  return (
    <section ref={sectionRef} className="py-32 lg:py-44 bg-background relative overflow-hidden grain">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/30 hidden lg:block" />

      <div className="container mx-auto px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          {/* Left — Editorial text (5 cols) */}
          <div className="lg:col-span-5 lg:pr-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary/80 mb-6 block">
                Nossa Filosofia
              </span>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-[0.88] mb-8">
                Ciência &<br />
                <span className="text-primary italic font-light">sensibilidade</span>
              </h2>

              <div className="editorial-line-left w-16 mb-8" />

              <p className="text-sm text-muted-foreground leading-[2.1] font-light mb-6">
                Acreditamos que a verdadeira beleza nasce do equilíbrio entre ciência de 
                ponta e o respeito à individualidade de cada pessoa. Cada protocolo é 
                personalizado, cada resultado é pensado para realçar — nunca mascarar.
              </p>

              <p className="text-sm text-muted-foreground leading-[2.1] font-light mb-10">
                Com mais de 14 anos de experiência, a Dra. Joice Ramos se especializou em 
                harmonização facial e corporal com abordagem que prioriza naturalidade, 
                segurança e resultados duradouros.
              </p>

              {/* Signature detail */}
              <div className="flex items-center gap-4 pt-6 border-t border-border/60">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                  <span className="font-serif text-xl font-semibold text-primary italic">JR</span>
                </div>
                <div>
                  <p className="font-serif text-base font-semibold text-foreground">Joice Ramos</p>
                  <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground font-bold mt-0.5">
                    Biomédica Esteta • CRBM 12345
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — Overlapping images (7 cols) */}
          <div className="lg:col-span-7 relative">
            <div className="relative lg:pl-12">
              {/* Main image */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-[2]"
              >
                <motion.div style={{ y: imgY }} className="overflow-hidden aspect-[4/5] lg:aspect-[3/4]">
                  <img
                    src={clinicInterior}
                    alt="Interior do Espaço Joice Ramos"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              </motion.div>

              {/* Overlapping secondary image */}
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-12 -left-6 lg:-left-12 w-[55%] z-[3]"
              >
                <motion.div style={{ y: imgY2 }} className="overflow-hidden aspect-[4/3] border-[6px] border-background shadow-2xl shadow-foreground/10">
                  <img
                    src={beautyProducts}
                    alt="Produtos de biomedicina estética"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              </motion.div>

              {/* Floating accent box */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute -top-6 -right-4 lg:-right-8 w-32 h-32 border border-primary/20 z-[1]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
