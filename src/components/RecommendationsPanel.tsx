import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, FlaskConical, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const recommendations = [
  {
    type: "irrigation",
    urgency: "high",
    title: "Irrigation Required",
    field: "Rice Field C",
    action: "Water needed in next 4 hours",
    reason: "Soil moisture below optimal level (45%)",
    icon: Droplets,
    color: "water",
  },
  {
    type: "fertilization",
    urgency: "medium",
    title: "Fertilization Scheduled",
    field: "Wheat Field A",
    action: "Apply nitrogen fertilizer in 2 days",
    reason: "Flowering stage requires nutrient boost",
    icon: FlaskConical,
    color: "fertilizer",
  },
  {
    type: "irrigation",
    urgency: "low",
    title: "Irrigation Upcoming",
    field: "Soybean Field D",
    action: "Water in 6 hours",
    reason: "Maintaining optimal moisture for germination",
    icon: Droplets,
    color: "water",
  },
  {
    type: "fertilization",
    urgency: "medium",
    title: "Fertilization Alert",
    field: "Rice Field C",
    action: "Postpone fertilization by 1 day",
    reason: "Rain expected tomorrow - wait for dry conditions",
    icon: AlertTriangle,
    color: "sun",
  },
];

const getUrgencyStyles = (urgency: string) => {
  switch (urgency) {
    case "high":
      return {
        border: "border-destructive/50",
        bg: "bg-destructive/5",
        badge: "bg-destructive/20 text-destructive",
      };
    case "medium":
      return {
        border: "border-sun/50",
        bg: "bg-sun/5",
        badge: "bg-sun/20 text-sun-foreground",
      };
    case "low":
      return {
        border: "border-primary/30",
        bg: "bg-primary/5",
        badge: "bg-primary/20 text-primary",
      };
    default:
      return {
        border: "border-border",
        bg: "bg-card",
        badge: "bg-muted text-muted-foreground",
      };
  }
};

const getColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    water: "text-water",
    fertilizer: "text-fertilizer",
    sun: "text-sun",
  };
  return colorMap[color] || "text-primary";
};

const RecommendationsPanel = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Smart Recommendations
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((rec, index) => {
            const styles = getUrgencyStyles(rec.urgency);
            return (
              <Card
                key={index}
                className={`${styles.border} ${styles.bg} border-2 hover:shadow-glow transition-all duration-300 hover-scale`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-card shadow-soft`}>
                        <rec.icon className={`h-6 w-6 ${getColorClass(rec.color)}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{rec.field}</p>
                      </div>
                    </div>
                    <span
                      className={`${styles.badge} px-3 py-1 rounded-full text-xs font-semibold uppercase`}
                    >
                      {rec.urgency}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">{rec.action}</p>
                      <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Done
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Reschedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecommendationsPanel;
