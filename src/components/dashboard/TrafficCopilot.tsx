import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, Lightbulb, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface TrafficCopilotProps {
    stats: any; // Using generic stats prop passed from Dashboard
}

const getHeuristicInsights = (stats: any) => {
    const insights = [];

    if (stats.totalLeads < 10) {
        insights.push({
            type: "alert",
            icon: AlertTriangle,
            text: "Volume de tráfego baixo hoje. Verifique se suas campanhas no Meta Ads estão ativas e gerando cliques.",
            color: "text-rose-500",
            bg: "bg-rose-500/10"
        });
    } else if (stats.conversionRate && parseInt(stats.conversionRate) < 5) {
        insights.push({
            type: "warning",
            icon: Lightbulb,
            text: `Sua taxa de conversão está em ${stats.conversionRate}. A oferta pode não estar sendo percebida como valiosa. Que tal criar um cupom de escassez?`,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        });
    } else {
        insights.push({
            type: "success",
            icon: TrendingUp,
            text: `Excelente! O volume de captação está forte. Notei que ${stats.topCity !== "—" ? stats.topCity : "o mobile"} traz leads de altíssima qualificação.`,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        });
    }

    insights.push({
        type: "info",
        icon: Sparkles,
        text: "Pico de leads qualificados costuma ocorrer entre 18h e 21h. O robô aumentará o tom de urgência para fechamentos noturnos automatically.",
        color: "text-primary",
        bg: "bg-primary/10"
    });

    return insights;
};

const TrafficCopilot = ({ stats }: TrafficCopilotProps) => {
    const [insights, setInsights] = useState<any[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        setInsights(getHeuristicInsights(stats));
    }, [stats]);

    useEffect(() => {
        if (insights.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % insights.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [insights]);

    if (insights.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
        >
            <Card className="relative overflow-hidden border border-slate-200 dark:border-white/10 bg-gradient-to-r from-slate-50 to-white dark:from-black/60 dark:to-[#0A0A0A]/90 dark:backdrop-blur-xl shadow-lg group">

                {/* Animated Glow Line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                {/* Blur Blobs */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>

                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-center min-h-[80px]">

                        {/* Title Section */}
                        <div className="flex items-center gap-3 px-6 py-4 md:py-0 w-full md:w-auto md:min-w-[260px] md:border-r border-slate-200 dark:border-white/10">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                                <Sparkles size={20} className="text-primary animate-pulse" />
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-black"></div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">Copiloto IA</h3>
                                <p className="text-[11px] text-slate-500 dark:text-white/50 uppercase font-semibold">Analisando Tráfego</p>
                            </div>
                        </div>

                        {/* Rotating Insights Content */}
                        <div className="flex-1 px-6 py-4 md:py-0 relative h-[80px] w-full flex items-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                {insights.length > 0 && insights[activeIdx] && (() => {
                                    const CurrentIcon = insights[activeIdx].icon;
                                    return (
                                        <motion.div
                                            key={activeIdx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.5 }}
                                            className="flex items-center gap-4 w-full"
                                        >
                                            <div className={`p-2 rounded-md ${insights[activeIdx].bg}`}>
                                                <CurrentIcon size={18} className={insights[activeIdx].color} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug max-w-2xl">
                                                {insights[activeIdx].text}
                                            </p>
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Indicators */}
                        <div className="hidden md:flex items-center gap-1.5 px-6">
                            {insights.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIdx ? 'w-4 bg-primary' : 'w-1.5 bg-slate-200 dark:bg-white/20'}`}
                                />
                            ))}
                        </div>

                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default TrafficCopilot;
