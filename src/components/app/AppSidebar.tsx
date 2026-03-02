import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Settings, LogOut, MessageSquare,
  Zap, Shield, CreditCard, BarChart3, Bot, Moon, Sun
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useTheme } from "../ThemeProvider";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
  { label: "Vendas e CRM", icon: Kanban, path: "/app/crm" },
  { label: "Agentes de IA", icon: Bot, path: "/app/agents" },
  { label: "Inbox Inteligente", icon: MessageSquare, path: "/app/conversations" },
];

const metricsNav = [
  { label: "Estatísticas", icon: BarChart3, path: "/app/analytics" },
];

const configNav = [
  { label: "Ajustes Globais", icon: Settings, path: "/app/settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { name: planName, currentLeads, leadLimit } = usePlanLimits();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-primary/50 dark:border-primary transition-all duration-300">
      <SidebarHeader className="px-5 py-6">
        <button onClick={() => navigate("/app")} className="flex items-center gap-3 w-full transition-transform hover:scale-105 active:scale-95 group">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:from-primary dark:via-primary/80 dark:to-emerald-600 flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(0,255,157,0.4)] border border-slate-800 dark:border-primary/20">
            <Zap size={16} className="text-white dark:drop-shadow-md" fill="currentColor" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
              Chat Vox
              <span className="bg-slate-100 text-slate-800 dark:bg-primary/20 dark:text-primary text-[9px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-primary/30 uppercase tracking-widest font-bold">Pro</span>
            </span>
          </div>
        </button>
      </SidebarHeader>

      <SidebarSeparator className="bg-slate-200 dark:bg-white/10 mx-5" />

      <SidebarContent className="px-3 pt-5 custom-scrollbar">
        {/* Principal */}
        {/* Nav Unificada - Sem Categorias */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 mt-4">
              {[...mainNav, ...metricsNav, ...configNav].map((item) => {
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={active}
                      className={`gap-4 h-11 rounded-lg px-4 text-sm font-semibold transition-all duration-300 group relative ${active
                        ? "bg-primary/10 border border-primary text-primary dark:bg-primary/15 dark:border-primary/50 dark:text-primary shadow-sm"
                        : "text-slate-600 border border-transparent hover:text-slate-900 hover:bg-slate-200 hover:border-slate-300 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 dark:hover:border-white/10"
                        }`}
                    >
                      <item.icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-primary dark:text-primary dark:drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]" : "text-slate-400 group-hover:text-slate-600 dark:text-white/40 dark:group-hover:text-white transition-colors"} />
                      <span className="tracking-wide relative z-10">{item.label}</span>
                      {active && (
                        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,255,157,1)] animate-pulse"></div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plan card — Solid, no glass */}
        <div className="mx-4 mt-8 p-5 rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-white/50">Licença Atual</span>
            <span className="text-[10px] uppercase font-bold text-slate-700 bg-slate-200 dark:text-primary dark:bg-primary/20 px-2 py-0.5 rounded-full">{planName}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2 relative z-10">
            <span className="font-sans text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{currentLeads}</span>
            <span className="text-[11px] text-slate-500 dark:text-white/40 font-bold tracking-widest uppercase">/ {leadLimit === null ? "∞" : leadLimit} LEADS</span>
          </div>
          {leadLimit !== null && (
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden relative z-10">
              <div
                className="h-full rounded-full bg-slate-800 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-primary dark:shadow-[0_0_10px_rgba(0,255,157,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((currentLeads / leadLimit) * 100, 100)}%` }}
              />
            </div>
          )}
          <button
            onClick={() => navigate("/pricing")}
            className="mt-5 w-full h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-800 dark:bg-white/10 dark:border-transparent dark:text-white dark:hover:bg-white/20 text-[12px] font-bold dark:text-white shadow-sm transition-all flex items-center justify-center gap-2 relative z-10 dark:hover:text-primary"
          >
            <CreditCard size={14} /> Fazer Upgrade
          </button>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-300 bg-slate-100 dark:border-white/10 dark:bg-[#050505]">
        <SidebarMenu className="gap-1">
          {/* Theme Toggle Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="gap-3 h-10 rounded-lg px-3 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="tracking-wide">Tema {theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate("/admin")}
                className="gap-3 h-10 rounded-lg px-3 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
              >
                <Shield size={18} />
                <span className="tracking-wide">Painel Admin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="gap-3 h-10 rounded-lg px-3 text-[13px] font-bold text-slate-600 hover:text-red-700 hover:bg-red-100 dark:text-white/60 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              <span className="tracking-wide">Encerrar Sessão</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
