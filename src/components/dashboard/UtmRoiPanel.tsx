import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ExternalLink } from "lucide-react";

interface UtmSourceData {
  source: string;
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: string;
  avgScore: number;
}

interface UtmRoiPanelProps {
  data: UtmSourceData[];
}

const PLATFORM_LABELS: Record<string, string> = {
  kiwify: "Kiwify",
  hotmart: "Hotmart",
  braip: "Braip",
  perfectpay: "PerfectPay",
  cakto: "Cakto",
  hipercash: "Hipercash",
  monetizze: "Monetizze",
  meta: "Meta Ads",
  facebook: "Meta Ads",
  instagram: "Instagram",
  google: "Google Ads",
  tiktok: "TikTok Ads",
  kwai: "Kwai Ads",
  taboola: "Taboola",
  eduzz: "Eduzz",
  ticto: "Ticto",
  greenn: "Greenn",
};

const getPlatformLabel = (source: string) =>
  PLATFORM_LABELS[source.toLowerCase()] || source;

const getSeverityColor = (rate: number) => {
  if (rate >= 50) return "text-emerald-500";
  if (rate >= 25) return "text-amber-500";
  return "text-destructive";
};

const UtmRoiPanel = ({ data }: UtmRoiPanelProps) => (
  <Card className="border-border bg-card">
    <CardHeader className="pb-2 px-5 pt-5">
      <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
        <TrendingUp size={16} className="text-primary" />
        ROI por Fonte (UTM)
      </CardTitle>
      <p className="text-xs text-muted-foreground mt-0.5">
        Performance de leads segmentada por plataforma de origem
      </p>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Fonte</th>
                <th className="text-center py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads</th>
                <th className="text-center py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Qualif.</th>
                <th className="text-center py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Taxa</th>
                <th className="text-center py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const rateNum = parseFloat(row.conversionRate);
                return (
                  <tr key={row.source} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">{getPlatformLabel(row.source)}</span>
                      </div>
                    </td>
                    <td className="text-center py-2.5">
                      <span className="font-semibold text-foreground">{row.totalLeads}</span>
                    </td>
                    <td className="text-center py-2.5">
                      <Badge variant="secondary" className="text-xs h-5">{row.qualifiedLeads}</Badge>
                    </td>
                    <td className="text-center py-2.5">
                      <span className={`font-semibold text-xs ${getSeverityColor(rateNum)}`}>
                        {row.conversionRate}
                      </span>
                    </td>
                    <td className="text-center py-2.5">
                      <span className="font-mono text-xs text-muted-foreground">{row.avgScore}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp size={28} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Dados de UTM aparecerão quando leads forem capturados com parâmetros de campanha.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Use ?utm_source=kiwify&utm_medium=cpc na URL do seu chat
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default UtmRoiPanel;
