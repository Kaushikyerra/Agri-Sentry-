import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sprout, Droplets, FlaskConical, MessageCircle, Calendar, Cloud, TrendingUp, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useFarm } from "@/contexts/FarmContext";

const Dashboard = () => {
  const { currentData } = useFarm();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalFields: 0,
    nextIrrigation: "Loading...",
    weatherTemp: "28°C",
    activeRecommendations: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    loadDashboardData();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const loadDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: crops } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', session.user.id);

    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'pending');

    const { data: nextIrrig } = await supabase
      .from('irrigation_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('irrigation_date', { ascending: false })
      .limit(1)
      .single();

    setStats({
      totalFields: crops?.length || 0,
      nextIrrigation: nextIrrig ? "Next 4 hours" : "Not scheduled",
      weatherTemp: "28°C",
      activeRecommendations: recommendations?.length || 0
    });
  };

  const quickAccessCards = [
    {
      title: "My Fields",
      description: "Manage all your crops",
      icon: Sprout,
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/my-fields"
    },
    {
      title: "Weather",
      description: "Check forecast",
      icon: Cloud,
      color: "text-accent",
      bgColor: "bg-accent/10",
      path: "/weather"
    },
    {
      title: "Irrigation",
      description: "Water management",
      icon: Droplets,
      color: "text-water",
      bgColor: "bg-water/10",
      path: "/irrigation"
    },
    {
      title: "Fertilizer",
      description: "Nutrient application",
      icon: FlaskConical,
      color: "text-fertilizer",
      bgColor: "bg-fertilizer/10",
      path: "/fertilizer"
    },
    {
      title: "Activity Log",
      description: "Track your activities",
      icon: Calendar,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      path: "/activity-log"
    },
    {
      title: "Mandi Prices",
      description: "Market Rates & AI Prediction",
      icon: IndianRupee,
      color: "text-green-600",
      bgColor: "bg-green-100",
      path: "/mandi-prices"
    },
    {
      title: "Ask Advisor",
      description: "Get AI recommendations",
      icon: MessageCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/advisor"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your farm overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold">{stats.totalFields}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-water/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Next Irrigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-water" />
                  <span className="text-xl font-bold">{stats.nextIrrigation}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Weather (Live)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-accent" />
                  <span className="text-3xl font-bold">{currentData.temperature}°C</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Humidity: {currentData.humidity}%</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  <span className="text-3xl font-bold">{stats.activeRecommendations}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickAccessCards.map((card) => (
                <Card
                  key={card.title}
                  className={`${card.bgColor} border-2 hover:shadow-glow transition-all cursor-pointer hover-scale`}
                  onClick={() => navigate(card.path)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-card shadow-soft">
                        <card.icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
