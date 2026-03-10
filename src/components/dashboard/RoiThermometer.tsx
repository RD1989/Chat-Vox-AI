import { motion } from "framer-motion";
import { TrendingUp, Banknote, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoiThermometerProps {
    qualifiedLeads: number;
    avgScore: number;
}

const RoiThermometer = ({ qualifiedLeads, avgScore }: RoiThermometerProps) => {
    // Cálculo hipotético persuasivo: 
    // Um atendente humano custaria R$ 5,00 por lead qualificado em tempo/esforço.
    // A IA faz de graça, então economizamos:
    const costPerHumanLead = 5.00;
    const totalSaved = qualifiedLeads * costPerHumanLead;

    // Calculando preenchimento do velocímetro (max 100%)
    // Vamos supor que economizar R$ 1000/mês é o "100%" da régua básica
    const percentage = Math.min((totalSaved / 1000) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-4 flex flex-col"
        >
            <Card className="h-full border-0 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black dark:from-[#050B14] dark:via-[#09111E] dark:to-black">
                {/* Efeito Glow Background */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[50px] rounded-full mix-blend-screen pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[50px] rounded-full mix-blend-screen pointer-events-none"></div>

                <CardHeader className="relative z-10 pb-2">
                    <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
                        <Banknote className="text-primary" size={20} />
                        Economia com a IA
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-medium">Custo de atendimento humano salvo</CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 flex flex-col items-center justify-center pt-4">

                    <div className="relative w-40 h-40 flex items-center justify-center mb-2">
                        {/* SVG Circular Progress - Thermometer */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background Circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="8"
                                fill="none"
                            />
                            {/* Foreground Animated Circle */}
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-primary drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]"
                                strokeDasharray="251.2"
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
                                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                strokeLinecap="round"
                            />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white mix-blend-screen drop-shadow-md">
                                R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1">Salvos</span>
                        </div>
                    </div>

                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-400" />
                            <span className="text-xs font-medium text-slate-300">Score Médio da IA Base</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md">
                            <span className="text-xs font-bold text-white">{avgScore} PTS</span>
                            <TrendingUp size={12} className="text-primary" />
                        </div>
                    </div>

                </CardContent>
            </Card>
        </motion.div>
    );
};

export default RoiThermometer;
