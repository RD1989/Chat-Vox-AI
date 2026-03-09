import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Copy, AlertCircle, Clock, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PixCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    planSlug: string;
    planName: string;
    userId: string;
}

export const PixCheckoutModal = ({ isOpen, onClose, planSlug, planName, userId }: PixCheckoutModalProps) => {
    const [loading, setLoading] = useState(true);
    const [pixData, setPixData] = useState<{ qrcode: string; copiapasta: string; payment_id: string; amount: number } | null>(null);
    const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

    // 1. Generate Pix
    useEffect(() => {
        if (isOpen && !pixData) {
            const generatePix = async () => {
                try {
                    const { data, error } = await supabase.functions.invoke("vox-payments", {
                        body: { plan_slug: planSlug, user_id: userId }
                    });

                    if (error) throw error;
                    setPixData(data);
                    setLoading(false);
                } catch (error: any) {
                    toast({ title: "Erro ao gerar Pix", description: error.message, variant: "destructive" });
                    onClose();
                }
            };
            generatePix();
        }
    }, [isOpen, planSlug, userId]);

    // 2. Poll for payment status
    useEffect(() => {
        if (!pixData || status === "paid") return;

        const interval = setInterval(async () => {
            const { data, error } = await supabase
                .from("vox_payments" as any)
                .select("status")
                .eq("id", pixData.payment_id)
                .single() as any;

            if (data?.status === "paid") {
                setStatus("paid");
                clearInterval(interval);
                toast({ title: "Pagamento confirmado!", description: "Seu plano foi ativado com sucesso." });
                setTimeout(() => {
                    window.location.reload(); // Refresh to update plan UI
                }, 2000);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [pixData, status]);

    // 3. Timer
    useEffect(() => {
        if (!pixData || status !== "pending") return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setStatus("expired");
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [pixData, status]);

    const copyPix = () => {
        if (pixData) {
            navigator.clipboard.writeText(pixData.copiapasta);
            toast({ title: "Código copiado!", description: "Cole no app do seu banco para pagar." });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-white/10 p-0 overflow-hidden">
                <div className="bg-primary/10 p-6 flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded-xl">
                        <Zap className="text-primary" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Checkout Seguro</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 italic">Processado via API Pix Nativa</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Gerando seu Pix...</p>
                        </div>
                    ) : status === "paid" ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="bg-green-500/20 p-4 rounded-full">
                                <CheckCircle2 className="text-green-500" size={60} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">PAGAMENTO APROVADO!</h2>
                            <p className="text-sm text-slate-500 text-center">Seu plano <strong>{planName}</strong> já está ativo em sua conta. Redirecionando...</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Você está pagando</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">Plano {planName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-primary">R$ {(pixData!.amount / 100).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center space-y-4">
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                        {pixData?.qrcode && (
                                            <img
                                                src={pixData.qrcode.startsWith("data:image") ? pixData.qrcode : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.copiapasta)}`}
                                                alt="QR Code Pix"
                                                className="w-48 h-48"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                                        <Clock size={14} className="text-primary" />
                                        Expira em: <span className="text-primary">{formatTime(timeLeft)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button onClick={copyPix} className="w-full h-12 bg-primary text-black font-black gap-2 hover:scale-[1.02] transition-transform">
                                    <Copy size={18} /> COPIAR PIX COPIA E COLA
                                </Button>
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-500">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                    <p>Abra o app do seu banco, escolha <strong>Pix</strong> e depois <strong>Ler QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-4 text-center border-t border-slate-100 dark:border-white/10">
                    <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors uppercase tracking-widest">
                        Cancelar e voltar
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
