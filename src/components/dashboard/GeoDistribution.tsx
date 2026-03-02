import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const GEO_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

interface GeoDistributionProps {
  data: Array<{ state: string; count: number }>;
}

const GeoDistribution = ({ data }: GeoDistributionProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <Card className="h-full border border-slate-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-xl shadow-lg relative overflow-hidden group">

      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>

      <CardHeader className="pb-2 px-6 pt-6 relative z-10">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Globe size={16} className="text-primary" />
          </div>
          Distribuição Global
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Origem geográfica dos leads qualificados.</p>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-4 relative z-10">
        {data.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-48 h-48 shrink-0 relative">
              {/* Inner glowing circle behind pie */}
              <div className="absolute inset-4 rounded-full bg-primary/5 blur-xl"></div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="state"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    stroke="none"
                    cornerRadius={6}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={GEO_COLORS[i % GEO_COLORS.length]} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 15, 22, 0.85)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "13px",
                      color: "#fff",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                    }}
                    itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Globe size={24} className="text-primary/50" />
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full">
              {data.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  key={item.state}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: GEO_COLORS[i % GEO_COLORS.length], color: GEO_COLORS[i % GEO_COLORS.length] }} />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate font-medium">{item.state}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-black/50 px-2 py-0.5 rounded">{item.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-full mb-4">
              <Globe size={32} className="text-slate-400 dark:text-white/30" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">O mapa de leads aparecerá aqui.</p>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default GeoDistribution;
