import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sprout, Droplets, FlaskConical, TrendingUp } from "lucide-react";

const crops = [
  {
    name: "Wheat Field A",
    type: "Wheat",
    stage: "Flowering",
    health: 92,
    progress: 75,
    nextIrrigation: "2 hours",
    nextFertilization: "3 days",
    expectedYield: "4.2 tons/ha",
    status: "healthy",
  },
  {
    name: "Corn Field B",
    type: "Corn",
    stage: "Vegetative",
    health: 88,
    progress: 45,
    nextIrrigation: "1 day",
    nextFertilization: "5 days",
    expectedYield: "7.8 tons/ha",
    status: "healthy",
  },
  {
    name: "Rice Field C",
    type: "Rice",
    stage: "Tillering",
    health: 78,
    progress: 60,
    nextIrrigation: "4 hours",
    nextFertilization: "2 days",
    expectedYield: "5.5 tons/ha",
    status: "needs-attention",
  },
  {
    name: "Soybean Field D",
    type: "Soybean",
    stage: "Germination",
    health: 95,
    progress: 20,
    nextIrrigation: "6 hours",
    nextFertilization: "1 week",
    expectedYield: "3.2 tons/ha",
    status: "excellent",
  },
];

const getHealthColor = (health: number) => {
  if (health >= 90) return "text-primary";
  if (health >= 75) return "text-sun";
  return "text-destructive";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "excellent":
      return <Badge className="bg-primary/20 text-primary border-primary">Excellent</Badge>;
    case "healthy":
      return <Badge className="bg-primary/10 text-primary border-primary/50">Healthy</Badge>;
    case "needs-attention":
      return <Badge className="bg-sun/20 text-sun-foreground border-sun">Needs Attention</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const CropStatusCards = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Crop Status</h2>
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary animate-grow" />
            <span className="font-stats text-2xl font-bold text-primary">
              {crops.length} Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {crops.map((crop, index) => (
            <Card
              key={crop.name}
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover-scale"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{crop.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{crop.type} • {crop.stage}</p>
                  </div>
                  {getStatusBadge(crop.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Health Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Crop Health</span>
                    <span className={`font-stats text-lg font-bold ${getHealthColor(crop.health)}`}>
                      {crop.health}%
                    </span>
                  </div>
                  <Progress value={crop.health} className="h-2" />
                </div>

                {/* Growth Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Growth Progress</span>
                    <span className="font-stats text-lg font-bold text-primary">
                      {crop.progress}%
                    </span>
                  </div>
                  <Progress value={crop.progress} className="h-2 bg-muted" />
                </div>

                {/* Recommendations Grid */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-water/10">
                    <Droplets className="h-5 w-5 text-water" />
                    <p className="text-xs text-muted-foreground">Next Water</p>
                    <p className="text-sm font-semibold">{crop.nextIrrigation}</p>
                  </div>

                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-fertilizer/10">
                    <FlaskConical className="h-5 w-5 text-fertilizer" />
                    <p className="text-xs text-muted-foreground">Fertilize</p>
                    <p className="text-sm font-semibold">{crop.nextFertilization}</p>
                  </div>

                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/10">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    <p className="text-xs text-muted-foreground">Yield</p>
                    <p className="text-sm font-semibold">{crop.expectedYield}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CropStatusCards;
