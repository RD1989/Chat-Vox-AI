import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

const GEO_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

interface TopCitiesProps {
  data: Array<{ city: string; state: string; count: number }>;
}

const TopCities = ({ data }: TopCitiesProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="lg:col-span-2"
  >
    <Card className="h-full border border-slate-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-xl shadow-lg relative overflow-hidden">

      {/* Subtle Background Glow */}
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none"></div>

      <CardHeader className="pb-2 px-6 pt-6 relative z-10">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <MapPin size={16} className="text-primary" />
          </div>
          Top Cidades
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Cidades com maior volume de leads qualificados</p>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2 relative z-10">
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item, i) => {
              const maxCount = data[0]?.count || 1;
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={`${item.city}-${item.state}`} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate group-hover:text-primary transition-colors">
                      {item.city}
                      <span className="font-normal text-slate-400 dark:text-white/40 ml-1.5 text-xs">({item.state})</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white ml-2 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3 + (i * 0.1), ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: GEO_COLORS[i % GEO_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-full mb-3">
              <MapPin size={24} className="text-slate-400 dark:text-white/30" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">Sem dados de cidades ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default TopCities;
