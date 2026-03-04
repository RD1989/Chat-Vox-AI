import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_KEY = "cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="bg-card border border-border rounded-xl p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <Cookie size={20} className="text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-1">Cookies & Privacidade</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{" "}
                  <Link to="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                  .
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleAccept} className="text-xs h-8">
                    Aceitar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReject} className="text-xs h-8">
                    Recusar
                  </Button>
                </div>
              </div>
              <button onClick={handleReject} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
