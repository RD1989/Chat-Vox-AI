import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
}

interface StatCardsGridProps {
  cards: StatCard[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const StatCardsGrid = ({ cards }: StatCardsGridProps) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  >
    {cards.map((card, idx) => (
      <motion.div key={card.label} variants={itemVariants}>
        <Card className="h-full border border-slate-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">

          {/* Subtle Hover Glow Effect (Iridescência) */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{card.label}</span>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <card.icon size={16} className="text-primary" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{card.value}</p>
            </div>

            <p className="text-[11px] font-medium text-slate-500 dark:text-white/40 mt-4 leading-relaxed line-clamp-2">{card.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </motion.div>
);

export default StatCardsGrid;
