import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  name: string;
  status: string;
  city: string | null;
  region: string | null;
  created_at: string;
  qualified: boolean;
  qualification_score: number | null;
}

interface RecentLeadsProps {
  leads: Lead[];
}

const RecentLeads = ({ leads }: RecentLeadsProps) => (
  <Card className="lg:col-span-3 border-border bg-card">
    <CardHeader className="pb-2 px-5 pt-5">
      <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
        <Clock size={16} className="text-primary" />
        Leads Recentes
      </CardTitle>
      <p className="text-xs text-muted-foreground mt-0.5">Últimos leads capturados pelo chat com localização</p>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      {leads.length > 0 ? (
        <div className="space-y-1">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {lead.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.city && lead.region
                      ? `${lead.city}, ${lead.region}`
                      : lead.city || lead.region || "Localização desconhecida"}
                    {" · "}
                    {format(new Date(lead.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lead.qualification_score !== null && lead.qualification_score > 0 && (
                  <span className="text-xs font-mono text-muted-foreground">{lead.qualification_score}pts</span>
                )}
                <Badge variant={lead.qualified ? "default" : "secondary"} className="text-xs font-medium h-5">
                  {lead.qualified ? "Qualificado" : lead.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Users size={24} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Seus leads aparecerão aqui quando forem capturados pelo chat.</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default RecentLeads;
