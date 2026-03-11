import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import OnboardingWizard from "./OnboardingWizard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Loader2, Bell, Settings, LogOut, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { useSound } from "@/hooks/useSound";

const pageTitles: Record<string, string> = {
  "/app": "Dashboard Visão Geral",
  "/app/crm": "Funil CRM",
  "/app/conversations": "Inbox & Conversas",
  "/app/analytics": "Analytics",
  "/app/agents": "Agentes IA",
  "/app/settings": "Configurações do Workspace",
};

const AppLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const plan = usePlanLimits();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Ativador Sonoro de novas respostas e Notificações Push
  useSound();
  usePushNotifications(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (data && !(data as any).onboarding_completed) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    };
    checkOnboarding();
  }, [user]);

  if (loading || !user || !onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingWizard
        userId={user.id}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  const initials = user.email?.slice(0, 2).toUpperCase() || "U";
  const pageTitle = pageTitles[location.pathname] || "";
  const username = user.email?.split("@")[0] || "";

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background dark:bg-transparent transition-colors duration-300">
          <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-transparent">

          <header className="h-14 border-b border-primary/50 bg-white dark:bg-black/20 dark:backdrop-blur-xl dark:border-primary flex items-center justify-between px-6 sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-500 hover:text-slate-900 dark:text-white/70 dark:hover:text-white" />
              {pageTitle && (
                <div className="flex items-center gap-3">
                  <div className="h-3.5 w-[3px] bg-primary/80 rounded-full hidden sm:block"></div>
                  <h2 className="text-[13px] font-semibold text-slate-800 dark:text-white/90 tracking-wide hidden sm:block uppercase">{pageTitle}</h2>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Botão de Upgrade Embutido no Cabeçalho */}
              {!plan.loading && plan.name === "Free" && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-primary/10 dark:hover:bg-primary/20 dark:text-primary transition-all font-bold text-[10px] uppercase tracking-wider relative group"
                >
                  <Sparkles size={12} className="group-hover:animate-pulse" /> Subir para o PRO
                </button>
              )}

              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 relative rounded-full transition-all">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,157,1)]" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-slate-50 rounded-full pl-1 pr-3 py-1 border border-transparent dark:hover:bg-white/5 dark:border-white/5 transition-all group">
                    <Avatar className="h-7 w-7 shadow-sm border border-primary/40 dark:border-primary/60 group-hover:border-primary transition-colors">
                      <AvatarFallback className="text-[10px] font-bold bg-primary text-white dark:bg-primary dark:text-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[12px] font-semibold text-slate-600 group-hover:text-slate-900 dark:text-white/80 dark:group-hover:text-white transition-colors hidden sm:block">
                      {username}
                    </span>
                  </button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-72 p-0 bg-white dark:bg-[#111] backdrop-blur-2xl border-slate-200 dark:border-white/10 shadow-xl rounded-xl overflow-hidden mt-1">
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-gradient-to-b dark:from-white/5 dark:to-transparent">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-200 dark:border-white/10 shadow-sm">
                        <AvatarFallback className="text-xs font-bold bg-slate-200 text-slate-700 dark:bg-primary dark:text-black">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{username}</p>
                        <p className="text-[11px] text-slate-500 dark:text-white/50 truncate font-medium">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {!plan.loading && (
                    <div className="p-4 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-500 dark:text-white/50 font-bold tracking-wider uppercase">Plano Atual</span>
                        <Badge className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-primary/20 dark:text-primary dark:border-primary/30">
                          {plan.name}
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="font-sans text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">{plan.currentLeads}</span>
                        <span className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-wider">/ {plan.leadLimit === null ? "∞" : plan.leadLimit} USADOS</span>
                      </div>

                      {plan.leadLimit !== null && (
                        <div className="w-full h-2 rounded-full bg-black/10 dark:bg-black/40 overflow-hidden mb-4 border border-border dark:border-white/5 glass-panel">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,157,0.5)]"
                            style={{ width: `${Math.min((plan.currentLeads / plan.leadLimit) * 100, 100)}%` }}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => navigate("/pricing")}
                        className="w-full h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border-none text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 text-[11px] font-bold dark:text-white transition-all flex items-center justify-center gap-2 hover:text-emerald-700 dark:hover:text-primary group"
                      >
                        <CreditCard size={13} className="group-hover:scale-110 transition-transform" />
                        FAZER UPGRADE AGORA
                      </button>
                    </div>
                  )}

                  <div className="p-1.5 bg-slate-50 dark:bg-black/30">
                    <button
                      onClick={() => navigate("/app/settings")}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 transition-all"
                    >
                      <Settings size={14} />
                      Configurações Globais
                    </button>
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-white/70 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all mt-0.5"
                    >
                      <LogOut size={14} />
                      Sair
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto CustomScrollbar">
            <div className="mx-auto w-full max-w-[1600px] h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
};

export default AppLayout;
