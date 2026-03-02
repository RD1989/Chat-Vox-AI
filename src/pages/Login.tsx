import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Zap } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={18} className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">Chat Vox</span>
        </div>

        <div className="border border-border bg-card rounded-lg p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">Entrar</h2>
          <p className="text-xs text-muted-foreground mb-8">Acesse seu painel de gestão de leads.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  Entrar
                  <ArrowRight size={14} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-6">
            <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">Esqueci minha senha</Link>
            <p className="text-xs text-muted-foreground">
              <Link to="/signup" className="text-primary font-medium hover:underline">Criar conta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
