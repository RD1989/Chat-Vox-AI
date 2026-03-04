import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const GEO_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface GeoDistributionProps {
  data: Array<{ state: string; count: number }>;
}

const GeoDistribution = ({ data }: GeoDistributionProps) => (
  <Card className="border-border bg-card">
    <CardHeader className="pb-2 px-5 pt-5">
      <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
        <Globe size={16} className="text-primary" />
        Distribuição Geográfica por Estado
      </CardTitle>
      <p className="text-xs text-muted-foreground mt-0.5">De onde vêm seus leads — identificado automaticamente via IP</p>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      {data.length > 0 ? (
        <div className="flex items-center gap-6">
          <div className="w-44 h-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="state" cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={2}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={GEO_COLORS[i % GEO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((item, i) => (
              <div key={item.state} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: GEO_COLORS[i % GEO_COLORS.length] }} />
                <span className="text-sm text-foreground flex-1 truncate">{item.state}</span>
                <span className="text-sm font-semibold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Globe size={28} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Dados geográficos aparecerão aqui conforme novos leads forem capturados.</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default GeoDistribution;
