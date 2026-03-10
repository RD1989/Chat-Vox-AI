import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "./components/ThemeProvider";

// Eager Loading para rotas vitais (Não quebram o fluxo crítico)
import Index from "./pages/Index";
import AppLayout from "./components/app/AppLayout";
import AdminLayout from "./components/admin/AdminLayout";
import NotFound from "./pages/NotFound";

// Lazy Loading para otimização de Bundle (O usuário só baixa a tela quando acessar)
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PublicChat = lazy(() => import("./pages/PublicChat"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));

// Telas Pesadas do Dashboard
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const CRM = lazy(() => import("./pages/app/CRM"));
const VoxSettings = lazy(() => import("./pages/app/VoxSettings"));
const Conversations = lazy(() => import("./pages/app/Conversations"));
const Analytics = lazy(() => import("./pages/app/Analytics"));
const Agents = lazy(() => import("./pages/app/Agents"));

// Telas do Admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminApiKeys = lazy(() => import("./pages/admin/AdminApiKeys"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAlerts = lazy(() => import("./pages/admin/AdminAlerts"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent redundant requests when switching tabs
      retry: 1,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  },
});

const FullScreenLoader = () => (
  <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="chatvox-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/chat/:userId" element={<PublicChat />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/exclusao-dados" element={<DataDeletion />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="crm" element={<CRM />} />
                <Route path="conversations" element={<Conversations />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="agents" element={<Agents />} />
                <Route path="settings" element={<VoxSettings />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="api" element={<AdminApiKeys />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="alerts" element={<AdminAlerts />} />
                <Route path="plans" element={<AdminPlans />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
