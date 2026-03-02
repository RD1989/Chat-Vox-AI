import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { motion } from "framer-motion";

interface EngagementData {
  source: string;
  avgMessages: number;
  avgScore: number;
}

interface EngagementBySourceProps {
  data: EngagementData[];
}

const EngagementBySource = ({ data }: EngagementBySourceProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.5 }}
  >
    <Card className="h-full border border-slate-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-xl shadow-lg relative overflow-hidden group">

      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 right-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none"></div>

      <CardHeader className="pb-2 px-6 pt-6 relative z-10">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <MessageSquare size={16} className="text-primary" />
          </div>
          Engajamento x Fonte
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
          Comparativo de Mensagens/Lead e Score de IA por plataforma.
        </p>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-4 relative z-10">
        {data.length > 0 ? (
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={24} barGap={8} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                  </linearGradient>
                  <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="source"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={12}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  dx={-12}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--primary))", opacity: 0.05 }}
                  contentStyle={{
                    backgroundColor: "rgba(10, 15, 22, 0.85)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "#fff",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                  }}
                  itemStyle={{ fontWeight: "bold" }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", fontWeight: 500, paddingTop: "15px" }}
                />
                <Bar
                  dataKey="avgMessages"
                  name="Msgs/Lead"
                  fill="url(#colorMsgs)"
                  radius={[6, 6, 0, 0]}
                  style={{ filter: "url(#barGlow)" }}
                />
                <Bar
                  dataKey="avgScore"
                  name="Score Médio (Pts)"
                  fill="url(#colorScore)"
                  radius={[6, 6, 0, 0]}
                  style={{ filter: "url(#barGlow)" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-full mb-3">
              <MessageSquare size={28} className="text-slate-400 dark:text-white/30" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">
              Métricas de engajamento por origem aparecerão com dados de UTM.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default EngagementBySource;
