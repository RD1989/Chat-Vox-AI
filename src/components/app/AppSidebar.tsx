import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Settings, LogOut, MessageSquare,
  Zap, Shield, CreditCard, BarChart3, Bot, Moon, Sun, ShoppingBag, MessageCircle
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
  { label: "Recuperação", icon: ShoppingBag, path: "/app/retargeting" },
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
  const {
    name: planName,
    currentLeads,
    leadLimit,
    currentRequests,
    requestLimit
  } = usePlanLimits();
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
              <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-widest font-bold ${isAdmin
                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-500 dark:border-amber-500/30"
                : "bg-slate-100 text-slate-800 dark:bg-primary/20 dark:text-primary border-slate-300 dark:border-primary/30"
                }`}>
                {isAdmin ? "Admin" : (planName === "Free" ? "Free" : "Pro")}
              </span>
            </span>
          </div>
        </button>
      </SidebarHeader>

      <SidebarSeparator className="bg-slate-200 dark:bg-white/10 mx-5" />

      <SidebarContent className="px-3 pt-5 custom-scrollbar flex flex-col">
        {/* Principal */}
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

        {/* Plan card — Premium Look */}
        <div className="mx-3 mt-8 mb-6 p-4 rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-white/50">Licença Atual</span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isAdmin
              ? "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/20"
              : "text-slate-700 bg-slate-200 dark:text-primary dark:bg-primary/20"
              }`}>
              {isAdmin ? "Ilimitada" : planName}
            </span>
          </div>

          {/* Leads Limit */}
          <div className="space-y-1.5 mb-4 relative z-10">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Leads Capturados</span>
              <div className="flex items-baseline gap-1">
                <span className="font-sans text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{currentLeads}</span>
                <span className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase">/ {leadLimit === null ? "∞" : leadLimit}</span>
              </div>
            </div>
            {leadLimit !== null && (
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${(currentLeads >= leadLimit) ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-primary"
                    }`}
                  style={{ width: `${Math.min((currentLeads / leadLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Messages Limit */}
          <div className="space-y-1.5 mb-6 relative z-10">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Interações IA</span>
              <div className="flex items-baseline gap-1">
                <span className="font-sans text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{currentRequests}</span>
                <span className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase">/ {requestLimit === null ? "∞" : requestLimit}</span>
              </div>
            </div>
            {requestLimit !== null && (
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${(currentRequests >= requestLimit) ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    }`}
                  style={{ width: `${Math.min((currentRequests / requestLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {!isAdmin && (
            <button
              onClick={() => navigate("/pricing")}
              className={`w-full h-10 rounded-lg text-[11px] font-bold shadow-md transition-all flex items-center justify-center gap-2 relative z-10 active:scale-[0.98] ${(leadLimit && currentLeads >= leadLimit) || (requestLimit && currentRequests >= requestLimit)
                ? "bg-red-600 text-white hover:bg-red-700 animate-bounce"
                : planName === "Free" ? "bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,157,0.5)] animate-pulse" : "bg-primary text-black hover:opacity-90 dark:shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                }`}
            >
              <Zap size={14} fill="currentColor" />
              {planName === "Free" ? "Subir para o PRO" : "Escalar meu Negócio"}
            </button>
          )}

          {isAdmin && (
            <div className="text-center py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Acesso de Desenvolvedor</span>
            </div>
          )}
        </div>

        {/* Anti-clipping spacer */}
        <div className="h-10 shrink-0" />
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
              onClick={() => window.open("https://wa.me/5522996051620?text=Ol%C3%A1%2C+preciso+de+suporte+com+o+Chat+Vox!", "_blank")}
              className="gap-3 h-10 rounded-lg px-3 text-[13px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="tracking-wide">Suporte WhatsApp</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
