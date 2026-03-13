import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { LanguageSelector } from "./components/LanguageSelector";
import "./i18n/config";

const queryClient = new QueryClient();

const App = () => {
  const [languageSelected, setLanguageSelected] = useState<boolean>(
    !!localStorage.getItem('selectedLanguage')
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      // If user is logged in, skip language selection
      if (session) {
        setLanguageSelected(true);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setLanguageSelected(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLanguageSelect = () => {
    setLanguageSelected(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-earth">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Kisan Sahayak...</p>
        </div>
      </div>
    );
  }

  // Show language selector only if not authenticated and language not selected
  if (!languageSelected && !isAuthenticated) {
    return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <FarmProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <VoiceWidget />
            <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Index />} />
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
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
};

export default App;
