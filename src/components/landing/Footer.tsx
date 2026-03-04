import { MapPin, Phone, Instagram, ArrowUpRight, Clock, Heart, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logoFlower from "@/assets/logo-flower.png";

const links = [
  { label: "Sobre", id: "sobre" },
  { label: "Tratamentos", id: "servicos" },
  { label: "Resultados", id: "depoimentos" },
  { label: "Contato", id: "contato" },
];

const Footer = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer id="contato" className="bg-foreground text-background relative overflow-hidden">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto">
          {/* Top — 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <img src={logoFlower} alt="Joice Ramos" className="h-8 w-auto brightness-[5] opacity-50" />
                <div>
                  <h3 className="font-serif text-lg font-semibold tracking-wide">Joice Ramos</h3>
                  <p className="text-[7px] tracking-[0.4em] uppercase text-background/25 font-bold">
                    Biomedicina Estética
                  </p>
                </div>
              </div>
              <p className="text-background/30 text-xs leading-[2] font-light">
                Há mais de 14 anos transformando vidas com ciência, tecnologia e cuidado personalizado.
              </p>
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <h4 className="text-[9px] uppercase tracking-[0.4em] font-bold text-background/20 mb-8">
                Navegação
              </h4>
              <div className="space-y-4">
                {links.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => scrollTo(l.id)}
                    className="block text-xs text-background/40 hover:text-primary transition-colors duration-500 font-light"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h4 className="text-[9px] uppercase tracking-[0.4em] font-bold text-background/20 mb-8">
                Contato
              </h4>
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-xs text-background/40">
                  <MapPin size={12} className="shrink-0 text-primary/60" />
                  <span className="font-light">Nova Iguaçu, RJ</span>
                </div>
                <a
                  href="https://wa.me/5521964136264"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-xs text-background/40 hover:text-primary transition-colors duration-500 group"
                >
                  <Phone size={12} className="shrink-0 text-primary/60" />
                  <span className="font-light">(21) 96413-6264</span>
                  <ArrowUpRight size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://instagram.com/espacojoiceramos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-xs text-background/40 hover:text-primary transition-colors duration-500 group"
                >
                  <Instagram size={12} className="shrink-0 text-primary/60" />
                  <span className="font-light">@espacojoiceramos</span>
                  <ArrowUpRight size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </motion.div>

            {/* Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h4 className="text-[9px] uppercase tracking-[0.4em] font-bold text-background/20 mb-8">
                Horário
              </h4>
              <div className="flex items-start gap-3 text-xs text-background/40">
                <Clock size={12} className="mt-0.5 shrink-0 text-primary/60" />
                <div className="space-y-2 font-light">
                  <p>Seg — Sex: 9h às 19h</p>
                  <p>Sáb: 9h às 14h</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-background/10 to-transparent mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-background/15 tracking-[0.15em] font-light">
              © {new Date().getFullYear()} Espaço Joice Ramos — Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacidade" className="text-[10px] text-background/20 hover:text-primary transition-colors flex items-center gap-1">
                <Shield size={8} />
                Privacidade
              </Link>
              <Link to="/exclusao-dados" className="text-[10px] text-background/20 hover:text-primary transition-colors">
                Exclusão de Dados
              </Link>
              <p className="text-[10px] text-background/10 tracking-[0.15em] font-light flex items-center gap-1.5">
                Designed with <Heart size={8} className="text-primary/40" /> purpose
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
