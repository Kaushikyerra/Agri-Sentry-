import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import QuickAccessTiles from "@/components/QuickAccessTiles";
import WeatherDashboard from "@/components/WeatherDashboard";
import CropStatusCards from "@/components/CropStatusCards";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import Navbar from "@/components/Navbar";
import AIChatbot from "@/components/AIChatbot";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Hero />
        <QuickAccessTiles />
        <WeatherDashboard />
        <CropStatusCards />
        <RecommendationsPanel />
      </div>
      <AIChatbot />
    </div>
  );
};

export default Index;
