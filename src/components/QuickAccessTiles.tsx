import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, Droplets, FlaskConical, MessageCircle, TrendingUp, Calendar } from "lucide-react";

const tiles = [
  {
    title: "Crop Status",
    description: "Monitor all your crops and their growth stages",
    icon: Sprout,
    color: "text-primary",
    bgColor: "bg-primary/10",
    hoverColor: "hover:bg-primary/20",
  },
  {
    title: "Irrigation",
    description: "Smart watering recommendations",
    icon: Droplets,
    color: "text-water",
    bgColor: "bg-water/10",
    hoverColor: "hover:bg-water/20",
  },
  {
    title: "Fertilization",
    description: "Optimize nutrient application",
    icon: FlaskConical,
    color: "text-fertilizer",
    bgColor: "bg-fertilizer/10",
    hoverColor: "hover:bg-fertilizer/20",
  },
  {
    title: "AI Advisor",
    description: "Ask farming questions anytime",
    icon: MessageCircle,
    color: "text-accent",
    bgColor: "bg-accent/10",
    hoverColor: "hover:bg-accent/20",
  },
  {
    title: "Yield Prediction",
    description: "Forecast your harvest outcomes",
    icon: TrendingUp,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    hoverColor: "hover:bg-secondary/20",
  },
  {
    title: "Activity Log",
    description: "Track your daily farming activities",
    icon: Calendar,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    hoverColor: "hover:bg-muted/80",
  },
];

const QuickAccessTiles = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Quick Access
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiles.map((tile) => (
            <Card 
              key={tile.title}
              className={`${tile.bgColor} ${tile.hoverColor} border-2 transition-all duration-300 hover:shadow-glow hover-scale cursor-pointer group`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`${tile.color} p-3 rounded-lg bg-card shadow-soft group-hover:animate-pulse-glow transition-all`}>
                    <tile.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{tile.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{tile.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccessTiles;
