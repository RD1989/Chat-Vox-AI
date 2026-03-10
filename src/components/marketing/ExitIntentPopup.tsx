import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ExitIntentPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasShown, setHasShown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            // Detecta se o mouse saiu pelo topo da página e se ainda não foi mostrado
            if (e.clientY <= 0 && !hasShown) {
                setIsOpen(true);
                setHasShown(true);
                // Salva no localStorage para não incomodar o usuário na mesma sessão
                sessionStorage.setItem("exit_popup_shown", "true");
            }
        };

        // Verifica se já foi mostrado nesta sessão
        const alreadyShown = sessionStorage.getItem("exit_popup_shown");
        if (alreadyShown) setHasShown(true);

        document.addEventListener("mouseleave", handleMouseLeave);
        return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }, [hasShown]);

    const handleClaimOffer = () => {
        setIsOpen(false);
        navigate("/pricing?coupon=OFF30");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Background elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 md:p-12 text-center relative z-0">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-8 relative">
                                <Gift className="text-primary" size={40} />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -top-1 -right-1"
                                >
                                    <Sparkles className="text-yellow-400" size={20} />
                                </motion.div>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter uppercase leading-none">
                                ESPERE! NÃO VÁ <br />EMBORA AINDA...
                            </h2>

                            <p className="text-slate-400 text-lg mb-8 max-w-xs mx-auto">
                                Temos um presente especial para você começar a vender com IA hoje mesmo.
                            </p>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Cupom Exclusivo</p>
                                <div className="text-5xl font-black text-white tracking-tighter">
                                    30% OFF
                                </div>
                                <p className="text-slate-400 text-xs mt-2 italic">Válido para o primeiro mês em qualquer plano</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleClaimOffer}
                                    className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-lg shadow-primary/20 group"
                                >
                                    RESGATAR MEU DESCONTO
                                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-500 text-sm hover:text-slate-300 transition-colors py-2"
                                >
                                    Não, prefiro pagar o valor cheio depois
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
