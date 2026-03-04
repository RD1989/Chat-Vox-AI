import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
}

interface StatCardsGridProps {
  cards: StatCard[];
}

const StatCardsGrid = ({ cards }: StatCardsGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    {cards.map((card) => (
      <Card key={card.label} className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <card.icon size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {card.label}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default StatCardsGrid;
