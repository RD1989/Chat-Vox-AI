import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

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
  if (rate >= 50) return "text-emerald-500 font-black";
  if (rate >= 25) return "text-amber-500 font-bold";
  return "text-red-500/80 font-bold";
};

const UtmRoiPanel = ({ data }: UtmRoiPanelProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
  >
    <Card className="h-full border border-slate-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-xl shadow-lg relative overflow-hidden group">

      {/* Subtle Background Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none"></div>

      <CardHeader className="pb-2 px-6 pt-6 relative z-10">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <TrendingUp size={16} className="text-primary" />
          </div>
          ROI por Fonte (UTM)
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
          Performance de leads segmentada por plataforma de origem.
        </p>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2 relative z-10">
        {data.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-white/5">
                <tr>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Fonte</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Leads</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Qualif.</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Conversão</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.map((row) => {
                  const rateNum = parseFloat(row.conversionRate);
                  return (
                    <tr key={row.source} className="hover:bg-white dark:hover:bg-white/5 transition-colors group/row cursor-default">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ExternalLink size={12} className="text-slate-400 group-hover/row:text-primary transition-colors shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{getPlatformLabel(row.source)}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">{row.totalLeads}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">{row.qualifiedLeads}</Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`text-xs ${getSeverityColor(rateNum)}`}>
                          {row.conversionRate}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-mono text-xs font-medium text-slate-500 dark:text-white/50">{row.avgScore}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-full mb-3">
              <TrendingUp size={28} className="text-slate-400 dark:text-white/30" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">
              Dados de UTM aparecerão quando leads forem capturados.
            </p>
            <p className="text-xs font-mono text-slate-400 dark:text-white/30 mt-2 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded">
              ?utm_source=kiwify&utm_medium=cpc
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default UtmRoiPanel;
