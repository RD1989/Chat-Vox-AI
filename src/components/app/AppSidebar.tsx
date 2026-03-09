import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Settings, LogOut, MessageSquare,
  Zap, Shield, BarChart3, Bot, Moon, Sun, ShoppingBag, MessageCircle
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

  const NavItem = ({ label, icon: Icon, path }: { label: string; icon: any; path: string }) => {
    const active = isActive(path);
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => navigate(path)}
          isActive={active}
          className={`gap-3 h-9 rounded-lg px-3 text-[13px] font-semibold transition-all duration-200 group relative ${active
            ? "bg-primary/10 border border-primary text-primary dark:bg-primary/15 dark:border-primary/50 dark:text-primary shadow-sm"
            : "text-slate-600 border border-transparent hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
            }`}
        >
          <Icon size={16} strokeWidth={active ? 2.5 : 2} className={active ? "text-primary dark:drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]" : "text-slate-400 group-hover:text-slate-600 dark:text-white/40 dark:group-hover:text-white transition-colors"} />
          <span className="tracking-wide">{label}</span>
          {active && (
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,255,157,1)] animate-pulse" />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const leadsPercent = leadLimit ? Math.min((currentLeads / leadLimit) * 100, 100) : 0;
  const requestsPercent = requestLimit ? Math.min((currentRequests / requestLimit) * 100, 100) : 0;

  return (
    <Sidebar className="border-r border-slate-200 dark:border-white/10 transition-all duration-300">
      {/* ─── HEADER ─── */}
      <SidebarHeader className="px-4 py-4">
        <button onClick={() => navigate("/app")} className="flex items-center gap-2.5 w-full transition-transform hover:scale-[1.02] active:scale-95">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-gradient-to-br dark:from-primary dark:to-emerald-600 flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(0,255,157,0.4)] border border-slate-800 dark:border-primary/20">
            <Zap size={14} className="text-white" fill="currentColor" />
          </div>
          <span className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            Chat Vox
            <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase tracking-widest font-bold ${isAdmin
              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-500 dark:border-amber-500/30"
              : "bg-slate-100 text-slate-800 dark:bg-primary/20 dark:text-primary border-slate-300 dark:border-primary/30"
              }`}>
              {isAdmin ? "Admin" : (planName === "Free" ? "Free" : "Pro")}
            </span>
          </span>
        </button>
      </SidebarHeader>

      <SidebarSeparator className="bg-slate-200 dark:bg-white/10 mx-4" />

      {/* ─── NAVIGATION ─── */}
      <SidebarContent className="px-3 pt-2 custom-scrollbar">
        {/* Operações */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold px-3 mb-1">
            Operações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavItem label="Dashboard" icon={LayoutDashboard} path="/app" />
              <NavItem label="Vendas e CRM" icon={Kanban} path="/app/crm" />
              <NavItem label="Inbox" icon={MessageSquare} path="/app/conversations" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Inteligência */}
        <SidebarGroup className="mt-1">
          <SidebarGroupLabel className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold px-3 mb-1">
            Inteligência
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavItem label="Agentes de IA" icon={Bot} path="/app/agents" />
              <NavItem label="Recuperação" icon={ShoppingBag} path="/app/retargeting" />
              <NavItem label="Estatísticas" icon={BarChart3} path="/app/analytics" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sistema */}
        <SidebarGroup className="mt-1">
          <SidebarGroupLabel className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold px-3 mb-1">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavItem label="Ajustes Globais" icon={Settings} path="/app/settings" />
              {isAdmin && (
                <NavItem label="Painel Admin" icon={Shield} path="/admin" />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ─── FOOTER ─── */}
      <SidebarFooter className="p-3 border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-black/30">
        {/* Plan Card — Ultra Compact */}
        <div className="mb-2 p-2.5 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 dark:text-white/40">Licença</span>
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${isAdmin
              ? "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/20"
              : "text-slate-600 bg-slate-100 dark:text-primary dark:bg-primary/20"
              }`}>
              {isAdmin ? "∞" : planName}
            </span>
          </div>

          {/* Dual progress — two bars side by side */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[8px] font-bold text-slate-400 dark:text-white/30 uppercase">Leads</span>
                <span className="text-[10px] font-extrabold text-slate-700 dark:text-white">{currentLeads}<span className="text-slate-400 dark:text-white/30 font-bold">/{leadLimit ?? "∞"}</span></span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${(leadLimit && currentLeads >= leadLimit) ? "bg-red-500" : "bg-primary"}`} style={{ width: `${leadsPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[8px] font-bold text-slate-400 dark:text-white/30 uppercase">IA</span>
                <span className="text-[10px] font-extrabold text-slate-700 dark:text-white">{currentRequests}<span className="text-slate-400 dark:text-white/30 font-bold">/{requestLimit ?? "∞"}</span></span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${(requestLimit && currentRequests >= requestLimit) ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${requestsPercent}%` }} />
              </div>
            </div>
          </div>

          {!isAdmin && (
            <button
              onClick={() => navigate("/pricing")}
              className={`w-full h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] ${(leadLimit && currentLeads >= leadLimit) || (requestLimit && currentRequests >= requestLimit)
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-primary text-black hover:bg-primary/90 shadow-[0_0_10px_rgba(0,255,157,0.3)]"
                }`}
            >
              <Zap size={11} fill="currentColor" />
              {planName === "Free" ? "Subir para o PRO" : "Escalar"}
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            title={`Tema ${theme === 'dark' ? 'Claro' : 'Escuro'}`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span className="hidden lg:inline">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
          </button>

          <button
            onClick={() => window.open("https://wa.me/5522996051620?text=Ol%C3%A1%2C+preciso+de+suporte+com+o+Chat+Vox!", "_blank")}
            className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10 transition-colors"
            title="Suporte WhatsApp"
          >
            <MessageCircle size={14} />
            <span className="hidden lg:inline">Suporte</span>
          </button>

          <button
            onClick={signOut}
            className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-100 dark:text-white/50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
            title="Sair"
          >
            <LogOut size={14} />
            <span className="hidden lg:inline">Sair</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
