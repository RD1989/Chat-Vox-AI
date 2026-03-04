import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Settings, LogOut, MessageSquare,
  Zap, Shield, CreditCard, BarChart3, Bot,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
  { label: "Agentes IA", icon: Bot, path: "/app/agents" },
  { label: "CRM", icon: Kanban, path: "/app/crm" },
  { label: "Conversas", icon: MessageSquare, path: "/app/conversations" },
  { label: "Analytics", icon: BarChart3, path: "/app/analytics" },
];

const configNav = [
  { label: "Configurações", icon: Settings, path: "/app/settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { name: planName, currentLeads, leadLimit } = usePlanLimits();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-4 py-4">
        <button onClick={() => navigate("/app")} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Zap size={14} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">ChatVox</span>
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/60 px-3 mb-0.5">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={active}
                      className={`gap-2.5 h-9 rounded-md px-2.5 text-[13px] transition-colors ${
                        active
                          ? "bg-secondary text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <item.icon size={15} strokeWidth={active ? 2 : 1.5} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/60 px-3 mb-0.5">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configNav.map((item) => {
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={active}
                      className={`gap-2.5 h-9 rounded-md px-2.5 text-[13px] transition-colors ${
                        active ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <item.icon size={15} strokeWidth={active ? 2 : 1.5} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plan card — minimal */}
        <div className="mx-2 mt-3 p-3 rounded-md border border-border bg-secondary/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground">Plano</span>
            <span className="text-[11px] font-semibold text-foreground">{planName}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-mono text-sm font-semibold text-foreground">{currentLeads}</span>
            <span className="text-[11px] text-muted-foreground">/ {leadLimit === null ? "∞" : leadLimit} leads</span>
          </div>
          {leadLimit !== null && (
            <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min((currentLeads / leadLimit) * 100, 100)}%` }}
              />
            </div>
          )}
          <button
            onClick={() => navigate("/pricing")}
            className="mt-2.5 w-full text-[11px] font-medium text-primary hover:underline flex items-center justify-center gap-1"
          >
            <CreditCard size={11} /> Upgrade
          </button>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border">
        <SidebarMenu>
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate("/admin")}
                className="gap-2.5 h-9 rounded-md px-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <Shield size={15} />
                <span>Admin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="gap-2.5 h-9 rounded-md px-2.5 text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              <LogOut size={15} />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
