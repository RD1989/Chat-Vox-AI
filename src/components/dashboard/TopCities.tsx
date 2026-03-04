import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const GEO_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface TopCitiesProps {
  data: Array<{ city: string; state: string; count: number }>;
}

const TopCities = ({ data }: TopCitiesProps) => (
  <Card className="lg:col-span-2 border-border bg-card">
    <CardHeader className="pb-2 px-5 pt-5">
      <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin size={16} className="text-primary" />
        Top Cidades
      </CardTitle>
      <p className="text-xs text-muted-foreground mt-0.5">Cidades com maior volume de leads</p>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      {data.length > 0 ? (
        <div className="space-y-2">
          {data.map((item, i) => {
            const maxCount = data[0]?.count || 1;
            const pct = Math.round((item.count / maxCount) * 100);
            return (
              <div key={`${item.city}-${item.state}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">
                    {item.city}
                    <span className="text-muted-foreground ml-1 text-xs">({item.state})</span>
                  </span>
                  <span className="font-semibold text-foreground ml-2">{item.count}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: GEO_COLORS[i % GEO_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <MapPin size={24} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Sem dados de cidades ainda.</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default TopCities;
