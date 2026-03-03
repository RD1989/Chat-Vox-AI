import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, Zap, Users, CheckCircle2 } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    slug: string;
    price_brl: number;
    agent_limit: number;
    lead_limit: number;
    request_limit: number | null;
    features: string[];
}

const AdminPlans = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const loadPlans = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("plans")
            .select("*")
            .order("price_brl", { ascending: true });

        if (error) {
            toast({ title: "Erro ao carregar planos", description: error.message, variant: "destructive" });
        } else {
            setPlans(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleUpdate = async (plan: Plan) => {
        setSaving(plan.id);
        const { error } = await supabase
            .from("plans")
            .update({
                name: plan.name,
                price_brl: plan.price_brl,
                agent_limit: plan.agent_limit,
                lead_limit: plan.lead_limit,
                request_limit: plan.request_limit,
            } as any)
            .eq("id", plan.id);

        if (error) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: `Plano ${plan.name} atualizado!` });
        }
        setSaving(null);
    };

    const updateLocalPlan = (id: string, field: keyof Plan, value: any) => {
        setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestão de Planos</h1>
                    <p className="text-sm text-muted-foreground mt-1">Edite preços, bônus e travas de mensagens do sistema.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={loadPlans} className="text-xs">
                    <RefreshCw size={14} className="mr-2" /> Atualizar
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="border-border bg-card overflow-hidden">
                        <div className={`h-1.5 w-full bg-primary ${plan.slug === 'scale' ? 'bg-destructive' : ''}`} />
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        {plan.name}
                                        {plan.slug === 'scale' && <Badge variant="destructive" className="text-[10px]">RECOMENDADO</Badge>}
                                    </CardTitle>
                                    <CardDescription>Slug: {plan.slug}</CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-foreground">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price_brl / 100)}
                                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Preço (Centavos)</Label>
                                    <Input
                                        type="number"
                                        value={plan.price_brl}
                                        onChange={(e) => updateLocalPlan(plan.id, 'price_brl', parseInt(e.target.value))}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Limite Agents</Label>
                                    <Input
                                        type="number"
                                        value={plan.agent_limit}
                                        onChange={(e) => updateLocalPlan(plan.id, 'agent_limit', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Limite Leads</Label>
                                    <Input
                                        type="number"
                                        value={plan.lead_limit}
                                        onChange={(e) => updateLocalPlan(plan.id, 'lead_limit', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Cota de Mensagens (Hard Stop)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Sem limite"
                                        value={plan.request_limit || ""}
                                        onChange={(e) => updateLocalPlan(plan.id, 'request_limit', e.target.value ? parseInt(e.target.value) : null)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><Users size={14} /> Ativos: <strong>Calculando...</strong></span>
                                    <span className="flex items-center gap-1.5"><Zap size={14} /> Mensagens: <strong>{plan.request_limit || 'Ilimitado'}</strong></span>
                                </div>
                                <Button onClick={() => handleUpdate(plan)} disabled={saving === plan.id} size="sm">
                                    {saving === plan.id ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AdminPlans;
