import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface EngagementData {
  source: string;
  avgMessages: number;
  avgScore: number;
}

interface EngagementBySourceProps {
  data: EngagementData[];
}

const EngagementBySource = ({ data }: EngagementBySourceProps) => (
  <Card className="border-border bg-card">
    <CardHeader className="pb-2 px-5 pt-5">
      <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
        <MessageSquare size={16} className="text-primary" />
        Engajamento do Chat por Origem
      </CardTitle>
      <p className="text-xs text-muted-foreground mt-0.5">
        Comparativo de mensagens/lead e score médio por plataforma
      </p>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      {data.length > 0 ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="source"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                formatter={(value) => (
                  <span className="text-muted-foreground">{value}</span>
                )}
              />
              <Bar dataKey="avgMessages" name="Msgs/Lead" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgScore" name="Score Médio" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare size={28} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Métricas de engajamento por origem aparecerão com dados de UTM.
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default EngagementBySource;
