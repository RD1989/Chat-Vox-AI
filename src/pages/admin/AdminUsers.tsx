import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Search, UserCheck, UserX, Trash2, MapPin,
  MessageSquare, BarChart3, Shield, Mail, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EnrichedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  company_name: string | null;
  plan: string;
  is_active: boolean;
  avatar_url: string | null;
  leads_count: number;
  qualified_leads: number;
  messages_count: number;
  interactive_messages: number;
  avg_score: number;
  conversion_rate: number;
  top_cities: Array<{ city: string; count: number }>;
  top_regions: Array<{ region: string; count: number }>;
  roles: string[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const callAdminEndpoint = async (action: string, user_id?: string) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, user_id }),
    });
    return res.json();
  };

  const loadUsers = async () => {
    setLoading(true);
    const result = await callAdminEndpoint("list_users");
    if (result.users) setUsers(result.users);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleActive = async (userId: string) => {
    setActionLoading(userId);
    const result = await callAdminEndpoint("toggle_active", userId);
    if (result.success) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: result.is_active } : u
      ));
      toast({ title: result.is_active ? "Usuário ativado" : "Usuário desativado" });
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    const result = await callAdminEndpoint("delete_user", userId);
    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: "Usuário excluído com sucesso" });
    } else {
      toast({ title: "Erro ao excluir", description: result.error, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.company_name?.toLowerCase().includes(q) ||
      u.plan.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Gerenciamento de Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} usuários registrados na plataforma. Gerencie contas, status e permissões.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou plano..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total de Usuários</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{users.filter(u => u.is_active).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Ativos</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{users.filter(u => !u.is_active).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Inativos</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{users.filter(u => u.roles.includes("admin")).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Administradores</p>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id} className={`border-border ${!u.is_active ? "opacity-60" : ""}`}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {u.full_name.slice(0, 2).toUpperCase() || "??"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {u.full_name || "Sem nome"}
                      </p>
                      {u.roles.includes("admin") && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                          <Shield size={10} className="mr-0.5" /> Admin
                        </Badge>
                      )}
                      <Badge variant={u.is_active ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                        {u.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail size={11} /> {u.email}
                      </span>
                      {u.company_name && (
                        <span>• {u.company_name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 flex-wrap">
                  <div className="text-center min-w-[45px]">
                    <p className="text-lg font-bold text-foreground">{u.leads_count}</p>
                    <p className="text-[10px]">Leads</p>
                  </div>
                  <div className="text-center min-w-[45px]">
                    <p className="text-lg font-bold text-foreground">{u.qualified_leads}</p>
                    <p className="text-[10px]">Qualif.</p>
                  </div>
                  <div className="text-center min-w-[45px]">
                    <p className="text-lg font-bold text-foreground">{u.messages_count}</p>
                    <p className="text-[10px]">Msgs</p>
                  </div>
                  <div className="text-center min-w-[45px]">
                    <p className="text-lg font-bold text-primary">{u.interactive_messages}</p>
                    <p className="text-[10px]">Bot</p>
                  </div>
                  <div className="text-center min-w-[45px]">
                    <p className="text-lg font-bold text-foreground">{u.conversion_rate}%</p>
                    <p className="text-[10px]">Conv.</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-[10px] capitalize">{u.plan}</Badge>
                    <p className="text-[10px] mt-0.5">Plano</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(u.id)}
                    disabled={actionLoading === u.id || u.roles.includes("admin")}
                    className="text-xs gap-1.5"
                  >
                    {actionLoading === u.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : u.is_active ? (
                      <UserX size={13} />
                    ) : (
                      <UserCheck size={13} />
                    )}
                    {u.is_active ? "Desativar" : "Ativar"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={u.roles.includes("admin")}
                        className="text-xs gap-1.5"
                      >
                        <Trash2 size={13} />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir usuário permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é irreversível. O usuário <strong>{u.full_name || u.email}</strong> e todos os seus dados
                          (leads, mensagens, configurações) serão excluídos permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-destructive text-destructive-foreground">
                          Sim, excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Bottom metadata */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  Cadastro: {format(new Date(u.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                </span>
                {u.last_sign_in_at && (
                  <span>
                    Último login: {format(new Date(u.last_sign_in_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </span>
                )}
                <span>ID: {u.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search size={24} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
