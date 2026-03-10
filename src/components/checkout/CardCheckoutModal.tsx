import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CardCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    planSlug: string;
    planName: string;
    userId: string;
    coupon?: string;
}

export const CardCheckoutModal = ({ isOpen, onClose, planSlug, planName, userId, coupon }: CardCheckoutModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        number: "",
        name: "",
        expiry: "",
        cvv: "",
        cpf: ""
    });

    // Reset loading if plan changes
    useEffect(() => {
        setLoading(false);
    }, [planSlug, coupon]);

    const handleSumbit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Em um cenário real, aqui usaríamos o SDK da Efí (checkout.js)
            // para gerar o payment token de forma segura.
            // Para manter a implementação agnóstica e funcional para o Antigravity:

            const { data, error } = await supabase.functions.invoke("vox-payments", {
                body: {
                    method: "card",
                    plan_slug: planSlug,
                    user_id: userId,
                    coupon,
                    card_data: {
                        // O token real seria gerado via Efi.setAccount('XX').setEnvironment('sandbox').getPaymentToken(...)
                        payment_token: "simulated_token_" + Math.random().toString(36).substring(7),
                        customer_name: formData.name,
                        customer_cpf: formData.cpf
                    }
                }
            });

            if (error) throw error;

            toast({ title: "Pagamento processado!", description: "Seu plano será ativado em instantes." });
            onClose();
            setTimeout(() => window.location.reload(), 2000);

        } catch (error: any) {
            toast({ title: "Erro no pagamento", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-white/10 p-0 overflow-hidden">
                <div className="bg-primary/10 p-6 flex items-center gap-4 border-b border-primary/5">
                    <div className="bg-primary/20 p-2 rounded-xl">
                        <CreditCard className="text-primary" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Cartão de Crédito</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 italic flex items-center gap-1">
                            <ShieldCheck size={12} /> Pagamento 100% Criptografado
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSumbit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">Número do Cartão</Label>
                        <Input
                            placeholder="0000 0000 0000 0000"
                            value={formData.number}
                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                            className="h-12 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">Nome Impresso no Cartão</Label>
                        <Input
                            placeholder="MARTA S OLIVEIRA"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            className="h-12 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Validade (MM/AA)</Label>
                            <Input
                                placeholder="12/30"
                                value={formData.expiry}
                                onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                className="h-12 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">CVV</Label>
                            <Input
                                placeholder="123"
                                value={formData.cvv}
                                onChange={e => setFormData({ ...formData, cvv: e.target.value })}
                                className="h-12 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">CPF do Titular</Label>
                        <Input
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                            className="h-12 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5"
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-primary text-black font-black text-lg gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> CONFIRMAR PAGAMENTO</>}
                        </Button>
                        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">Ao clicar, você concorda com os termos de uso e cobrança.</p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
