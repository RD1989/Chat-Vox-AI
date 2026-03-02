import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, Wand2, Globe, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (generatedPrompt: string, suggestedName: string) => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function OnboardingWizard({ open, onOpenChange, onSuccess }: OnboardingWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [url, setUrl] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);

    // Reset steps when closed
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep(1);
                setUrl("");
                setAnalyzing(false);
                setAnalysisLogs([]);
            }, 300);
        }
    }, [open]);

    const addLog = async (msg: string, delay: number) => {
        await sleep(delay);
        setAnalysisLogs(prev => [...prev, msg]);
    };

    const startAnalysis = async () => {
        if (!url) return;
        setStep(2);
        setAnalyzing(true);
        setAnalysisLogs(["Conectando aos servidores web..."]);

        await addLog("Extraindo código fonte da Landing Page...", 1200);
        await addLog("Identificando dores do público-alvo...", 1500);
        await addLog("Mapeando objeções principais de compra...", 1300);
        await addLog("Sintetizando tom de voz e abordagem comercial...", 1800);
        await addLog("Finalizando construção da Neural Network de Vendas...", 1000);

        setAnalyzing(false);
        setStep(3);
    };

    const handleFinish = () => {
        const domain = url.replace(/(^\w+:|^)\/\//, '').split('/')[0];
        const generatedPrompt = `Você é um especialista em vendas sênior e fechador (Closer) do produto hospedado em ${domain}. Seu objetivo é ler o interesse do cliente, contornar objeções como preço ou segurança, e enviar o link de checkout apenas no momento certo com técnicas de escassez e urgência. Seja direto e humano.`;
        const suggestedName = `Vendedor Auto - ${domain.split('.')[0]}`;

        onSuccess(generatedPrompt, suggestedName);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] overflow-hidden p-0 gap-0 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-8 relative z-10"
                        >
                            <DialogHeader className="mb-6 space-y-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                                    <Wand2 className="text-primary w-6 h-6" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Criação Mágica de IA</DialogTitle>
                                <DialogDescription className="text-base text-slate-500 dark:text-white/60">
                                    Não perca tempo configurando prompts. Insira o link da sua Página de Vendas (VSL) e nossa inteligência vai ler seu site e construir o vendedor perfeito.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="url" className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2">
                                        <Globe size={16} className="text-primary" />
                                        URL da Página de Vendas
                                    </Label>
                                    <Input
                                        id="url"
                                        placeholder="https://seu-produto.com.br"
                                        className="h-12 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 focus-visible:ring-primary"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-8">
                                <Button variant="ghost" onClick={() => onOpenChange(false)} className="dark:text-white hover:bg-slate-100 dark:hover:bg-white/5">
                                    Preencher Manualmente
                                </Button>
                                <Button
                                    onClick={startAnalysis}
                                    disabled={!url || url.length < 5}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all flex items-center gap-2 h-10"
                                >
                                    <Sparkles size={16} />
                                    Ler meu Site
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="p-10 flex flex-col items-center justify-center text-center relative z-10 min-h-[400px]"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                                <div className="w-20 h-20 bg-slate-100 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center relative z-10 shadow-xl">
                                    {analyzing ? (
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    ) : (
                                        <Sparkles className="w-8 h-8 text-primary" />
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Crawler IA em Ação</h3>

                            <div className="w-full max-w-sm space-y-3">
                                {analysisLogs.map((log, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx}
                                        className="flex items-center gap-3 text-sm font-mono text-left bg-slate-50 dark:bg-white/5 p-3 rounded-md border border-slate-100 dark:border-white/5"
                                    >
                                        <Code2 size={14} className="text-primary shrink-0" />
                                        <span className="text-slate-600 dark:text-white/70 line-clamp-1">{log}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 text-center relative z-10"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <Wand2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Persona Extraída com Sucesso!</h3>
                            <p className="text-slate-500 dark:text-white/60 mb-8 max-w-sm mx-auto">
                                O modelo compreendeu seu produto e gerou o comportamento de vendas ideal. Você poderá revisar os prompts a seguir.
                            </p>

                            <Button
                                onClick={handleFinish}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_hsl(var(--primary)/0.3)] h-12 text-lg flex items-center gap-2"
                            >
                                Injetar Configuração
                                <ArrowRight size={18} />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
