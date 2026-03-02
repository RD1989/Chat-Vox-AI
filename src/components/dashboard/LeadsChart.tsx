import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";

interface LeadsChartProps {
  data: Array<{ date: string; leads: number }>;
}

const LeadsChart = ({ data }: LeadsChartProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    <Card className="h-full border border-slate-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-xl shadow-lg relative overflow-hidden group">

      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>

      <CardHeader className="pb-2 px-6 pt-6 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Activity size={16} className="text-primary" />
            </div>
            Captura de Leads (7 Dias)
          </CardTitle>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
            Tempo Real
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Volume diário de novos contatos gerados automaticamente pela IA.</p>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2 relative z-10">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeadsDrop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />

              <XAxis
                dataKey="date"
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
                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5, strokeDasharray: "4 4", opacity: 0.5 }}
                contentStyle={{
                  backgroundColor: "rgba(10, 15, 22, 0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#fff",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                }}
                itemStyle={{ color: "hsl(var(--primary))", fontWeight: "bold" }}
                labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}
              />

              <Area
                type="monotone"
                dataKey="leads"
                name="Novos Leads"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorLeadsDrop)"
                activeDot={{ r: 6, fill: "#fff", stroke: "hsl(var(--primary))", strokeWidth: 3 }}
                style={{ filter: "url(#glow)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default LeadsChart;
