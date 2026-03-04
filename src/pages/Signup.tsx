import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Zap } from "lucide-react";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao criar conta", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Conta criada!", description: "Você já pode acessar o painel." });
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={18} className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">ChatVox</span>
        </div>

        <div className="border border-border bg-card rounded-lg p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">Criar Conta</h2>
          <p className="text-xs text-muted-foreground mb-8">Comece a qualificar seus leads com IA.</p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Nome completo</Label>
              <Input
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">E-mail</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  Criar Conta
                  <ArrowRight size={14} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
