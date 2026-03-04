import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DataDeletion = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      toast({ title: "Informe seu e-mail ou telefone", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("lgpd-deletion-request", {
        body: { email: email.trim(), phone: phone.trim(), reason: reason.trim() },
      });

      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Solicitação enviada!", description: "Responderemos em até 15 dias úteis." });
    } catch {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente ou entre em contato por e-mail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-lg">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft size={14} className="mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Exclusão de Dados Pessoais</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8">
          Conforme previsto no Art. 18 da LGPD (Lei nº 13.709/2018), você pode solicitar a exclusão dos seus dados pessoais.
        </p>

        {submitted ? (
          <div className="border border-border bg-card rounded-lg p-8 text-center">
            <Trash2 size={40} className="text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Solicitação Recebida</h2>
            <p className="text-sm text-muted-foreground">
              Sua solicitação foi registrada. Responderemos em até <strong>15 dias úteis</strong>, conforme a legislação.
            </p>
          </div>
        ) : (
          <div className="border border-border bg-card rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">E-mail cadastrado</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Telefone/WhatsApp</Label>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Motivo (opcional)</Label>
                <Textarea
                  placeholder="Descreva o motivo da solicitação..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Ao enviar, você confirma ser o titular dos dados informados.
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={14} className="mr-2" />
                    Solicitar Exclusão
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDeletion;
