import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sprout, Droplets, FlaskConical, Cloud, TrendingUp, IndianRupee, Sparkles, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useFarm } from "@/contexts/FarmContext";
import { LiveAssistant } from "@/components/LiveAssistant";

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
      description: "Manage crops & land",
      icon: Sprout,
      color: "text-green-600",
      bgIcon: "bg-green-100",
      path: "/my-fields"
    },
    {
      title: "Irrigation",
      description: "Water management",
      icon: Droplets,
      color: "text-blue-600",
      bgIcon: "bg-blue-100",
      path: "/irrigation"
    },
    {
      title: "Fertilizer",
      description: "Nutrient planning",
      icon: FlaskConical,
      color: "text-orange-600",
      bgIcon: "bg-orange-100",
      path: "/fertilizer"
    },
    {
      title: "Mandi Prices",
      description: "Market Rates & AI",
      icon: IndianRupee,
      color: "text-emerald-600",
      bgIcon: "bg-emerald-100",
      path: "/mandi-prices"
    },
    {
      title: "Activity Log",
      description: "Farm history",
      icon: Activity,
      color: "text-violet-600",
      bgIcon: "bg-violet-100",
      path: "/activity-log"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <Navbar />

      <div className="pt-24 px-4 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Farm Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Real-time insights for your smart farm.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Stats Grid - Clean White Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Sprout className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{stats.totalFields}</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate('/irrigation')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Next Irrigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Droplets className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 truncate">{stats.nextIrrigation}</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-white border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate('/weather')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-sky-600 transition-colors">Weather (Live)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-50 rounded-lg">
                      <Cloud className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{currentData.temperature}°C</div>
                      <p className="text-xs text-gray-500">Humidity: {currentData.humidity}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access - Minimalist */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickAccessCards.map((card) => (
                  <Card
                    key={card.title}
                    className="bg-white border hover:border-gray-300 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(card.path)}
                  >
                    <CardHeader className="flex flex-row items-center gap-4 p-5">
                      <div className={`p-3 rounded-xl ${card.bgIcon} transition-transform group-hover:scale-110 duration-300`}>
                        <card.icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base text-gray-900 group-hover:text-primary transition-colors">
                          {card.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{card.description}</p>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Assistant */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24">
              <LiveAssistant />

              {/* Additional Info Box */}
              <div className="mt-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <h3 className="font-semibold text-green-800 mb-2">Did you know?</h3>
                <p className="text-sm text-green-700 leading-relaxed">
                  You can ask the assistant about real-time mandi prices or weather forecasts just by speaking naturally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
