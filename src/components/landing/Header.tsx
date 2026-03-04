import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoFlower from "@/assets/logo-flower.png";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const navItems = [
    ["Sobre", "sobre"],
    ["Tratamentos", "servicos"],
    ["Resultados", "depoimentos"],
    ["Contato", "contato"],
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/50 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6 lg:px-8">
        {/* Brand */}
        <button onClick={() => scrollTo("hero")} className="flex items-center gap-3 group">
          <img src={logoFlower} alt="Joice Ramos" className="h-9 w-auto" />
          <div className="flex flex-col items-start">
            <span className="font-serif text-xl font-semibold text-foreground tracking-wide">
              Joice Ramos
            </span>
            <span className="text-[7px] tracking-[0.4em] uppercase text-muted-foreground/60 font-bold">
              Biomedicina Estética
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(([label, id]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/40 hover:text-primary transition-colors duration-500"
            >
              {label}
            </button>
          ))}
          <Button
            onClick={() => scrollTo("agendar")}
            className="ml-6 text-[10px] tracking-[0.2em] uppercase px-7 py-5 rounded-none font-bold magnetic-btn"
          >
            Agendar
          </Button>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground/60"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-background/98 backdrop-blur-xl border-t border-border/50"
          >
            <div className="flex flex-col p-8 gap-5">
              {navItems.map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-left text-sm font-medium text-foreground/50 hover:text-primary transition-colors tracking-[0.1em] uppercase"
                >
                  {label}
                </button>
              ))}
              <Button
                onClick={() => scrollTo("agendar")}
                className="mt-4 w-full tracking-[0.15em] uppercase text-[10px] rounded-none py-6 font-bold"
              >
                Agendar Avaliação
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
