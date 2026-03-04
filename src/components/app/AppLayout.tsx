import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import OnboardingWizard from "./OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Loader2, Bell, User, CreditCard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";

const pageTitles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/crm": "CRM",
  "/app/conversations": "Conversas",
  "/app/analytics": "Analytics",
  "/app/settings": "Configurações",
};

const AppLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const plan = usePlanLimits();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Push notifications
  usePushNotifications(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  // Check onboarding
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
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              {pageTitle && (
                <h2 className="text-[13px] font-medium text-foreground hidden sm:block">{pageTitle}</h2>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground relative">
                <Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-secondary rounded-md px-2 py-1 transition-colors">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px] font-semibold bg-secondary text-muted-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[12px] font-medium text-foreground hidden sm:block">{username}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-[11px] font-semibold bg-secondary text-muted-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{username}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {!plan.loading && (
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-muted-foreground">Plano atual</span>
                        <Badge variant="secondary" className="text-[10px] font-medium">{plan.name}</Badge>
                      </div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="font-mono text-lg font-semibold text-foreground">{plan.currentLeads}</span>
                        <span className="text-[11px] text-muted-foreground">/ {plan.leadLimit === null ? "∞" : plan.leadLimit} leads usados</span>
                      </div>
                      {plan.leadLimit !== null && (
                        <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${Math.min((plan.currentLeads / plan.leadLimit) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                      <button
                        onClick={() => navigate("/pricing")}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        Fazer upgrade →
                      </button>
                    </div>
                  )}

                  <div className="p-1.5">
                    <button
                      onClick={() => navigate("/app/settings")}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings size={14} />
                      Configurações
                    </button>
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut size={14} />
                      Sair da conta
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          <div className="flex-1 p-5 lg:p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
