import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Loader2, Shield, LayoutDashboard, Users, Key, Settings, LogOut, Bell } from "lucide-react";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Visão Geral", icon: LayoutDashboard, path: "/admin" },
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Alertas", icon: Bell, path: "/admin/alerts" },
  { label: "Chave API", icon: Key, path: "/admin/api" },
  { label: "Configurações", icon: Settings, path: "/admin/settings" },
];

const AdminLayout = () => {
  const { isAdmin, loading } = useAdminCheck();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/app");
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <button onClick={() => navigate("/admin")} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
                <Shield size={16} className="text-destructive-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
                Admin
              </span>
            </button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-4">
                Painel
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={isActive}
                          className="gap-3"
                        >
                          <item.icon size={18} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border space-y-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/app")} className="gap-3 text-muted-foreground">
                  <LayoutDashboard size={18} />
                  <span className="text-sm font-medium">Voltar ao App</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="gap-3 text-muted-foreground hover:text-destructive">
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card sticky top-0 z-30">
            <SidebarTrigger />
            <span className="ml-3 text-xs font-semibold text-destructive uppercase tracking-widest">Área do Administrador</span>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
