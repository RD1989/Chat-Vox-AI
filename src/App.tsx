import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import PublicChat from "./pages/PublicChat";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/app/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import CRM from "./pages/app/CRM";
import VoxSettings from "./pages/app/VoxSettings";
import Conversations from "./pages/app/Conversations";
import Analytics from "./pages/app/Analytics";
import Agents from "./pages/app/Agents";
import Retargeting from "./pages/app/Retargeting";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApiKeys from "./pages/admin/AdminApiKeys";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminPlans from "./pages/admin/AdminPlans";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import CookieConsent from "./components/CookieConsent";
import { ThemeProvider } from "./components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="chatvox-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              <Route path="retargeting" element={<Retargeting />} />
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
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
