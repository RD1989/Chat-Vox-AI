import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface LeadsChartProps {
  data: Array<{ date: string; leads: number }>;
}

const LeadsChart = ({ data }: LeadsChartProps) => (
  <Card className="border-border bg-card">
    <CardHeader className="pb-2 px-5 pt-5">
      <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        Leads capturados — últimos 7 dias
      </CardTitle>
      <p className="text-xs text-muted-foreground mt-0.5">Volume diário de novos leads pelo chat</p>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
              contentStyle={{
                backgroundColor: "rgba(10, 15, 22, 0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid hsl(var(--primary) / 0.3)",
                borderRadius: "12px",
                fontSize: "13px",
                color: "#fff",
                boxShadow: "0 0 20px rgba(0,255,157,0.15)"
              }}
              itemStyle={{ color: "hsl(var(--primary))", fontWeight: "bold" }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorLeads)"
              activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "#000", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export default LeadsChart;
