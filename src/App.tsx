import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./components/AuthPage";
import Dashboard from "./pages/Dashboard";
import MyFields from "./pages/MyFields";
import Weather from "./pages/Weather";
import Advisor from "./pages/Advisor";
import ActivityLog from "./pages/ActivityLog";
import Irrigation from "./pages/Irrigation";
import Fertilizer from "./pages/Fertilizer";
import MandiPrices from "./pages/MandiPrices";
import NotFound from "./pages/NotFound";
import { FarmProvider } from "./contexts/FarmContext";
import { LiveAssistant } from "./components/LiveAssistant";
import ProtectedRoute from "./components/ProtectedRoute";
import VoiceWidget from "./components/VoiceWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FarmProvider>
        <BrowserRouter>
          <VoiceWidget />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-fields" element={<MyFields />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route
              path="/voice-assistant"
              element={
                <ProtectedRoute>
                  <LiveAssistant />
                </ProtectedRoute>
              }
            />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/irrigation" element={<Irrigation />} />
            <Route path="/fertilizer" element={<Fertilizer />} />
            <Route path="/mandi-prices" element={<MandiPrices />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FarmProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
