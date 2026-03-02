import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  plan: {
    loading: boolean;
    name: string;
    currentLeads: number;
    leadLimit: number | null;
  };
}

const DashboardHeader = ({ plan }: DashboardHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Acompanhe a performance dos seus leads em tempo real. Dados atualizados automaticamente.
      </p>
    </div>
    {!plan.loading && (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Plano</span>
        <Badge variant="secondary" className="text-xs font-medium">{plan.name}</Badge>
        <span className="font-mono text-foreground">
          {plan.currentLeads}<span className="text-muted-foreground">/{plan.leadLimit === null ? "∞" : plan.leadLimit}</span>
        </span>
      </div>
    )}
  </div>
);

export default DashboardHeader;
