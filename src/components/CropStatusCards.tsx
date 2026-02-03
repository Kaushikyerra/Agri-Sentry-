import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sprout, Droplets, FlaskConical, TrendingUp } from "lucide-react";

const crops = [
  {
    id: 'wheat-a',
    name: "Wheat Field A",
    type: "Wheat",
    stage: "Flowering",
    progress: 75,
    expectedYield: "4.2 tons/ha",
    nextFertilization: "3 days",
  },
  {
    id: 'corn-b',
    name: "Corn Field B",
    type: "Corn",
    stage: "Vegetative",
    progress: 45,
    expectedYield: "7.8 tons/ha",
    nextFertilization: "5 days",
  },
  {
    id: 'rice-c',
    name: "Rice Field C",
    type: "Rice",
    stage: "Tillering",
    progress: 60,
    expectedYield: "5.5 tons/ha",
    nextFertilization: "2 days",
  },
  {
    id: 'soybean-d',
    name: "Soybean Field D",
    type: "Soybean",
    stage: "Germination",
    progress: 20,
    expectedYield: "3.2 tons/ha",
    nextFertilization: "1 week",
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

import { useFarm } from "@/contexts/FarmContext";

const CropStatusCards = () => {
  const { fieldData, simulatedTime } = useFarm();

  const getDynamicStatus = (moisture: number) => {
    if (moisture > 80) return "excellent";
    if (moisture > 40) return "healthy";
    return "needs-attention";
  };

  const getIrrigationStatus = (moisture: number) => {
    // Basic logic: if moisture < 40, need water soon
    if (moisture < 30) return "IMMEDIATE";
    if (moisture < 50) return "Today";
    return "2-3 Days";
  };

  return (
    <section className="py-16 px-4 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Crop Status</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Simulation Time: {simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary animate-grow" />
            <span className="font-stats text-2xl font-bold text-primary">
              {crops.length} Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {crops.map((crop, index) => {
            const data = fieldData[crop.id] || { soilMoisture: 50, temperature: 25 };
            const status = getDynamicStatus(data.soilMoisture);
            const irrig = getIrrigationStatus(data.soilMoisture);

            // Calculate health based on ideal conditions (simplified)
            // Ideal moisture 60-80
            const moistureDiff = Math.abs(data.soilMoisture - 70);
            const health = Math.max(0, Math.min(100, 100 - moistureDiff));

            return (
              <Card
                key={crop.name}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover-scale bg-white"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{crop.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{crop.type} • {crop.stage}</p>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Health Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Crop Health (Live)</span>
                      <span className={`font-stats text-lg font-bold ${getHealthColor(health)}`}>
                        {Math.round(health)}%
                      </span>
                    </div>
                    <Progress value={health} className="h-2" />
                  </div>

                  {/* Soil Moisture (replacing progress for demo relevance) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Soil Moisture</span>
                      <span className="font-stats text-lg font-bold text-blue-600">
                        {data.soilMoisture}%
                      </span>
                    </div>
                    <Progress value={data.soilMoisture} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                  </div>

                  {/* Recommendations Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-water/10">
                      <Droplets className={`h-5 w-5 ${irrig === 'IMMEDIATE' ? 'text-red-500 animate-bounce' : 'text-water'}`} />
                      <p className="text-xs text-muted-foreground">Irrigation</p>
                      <p className={`text-sm font-semibold ${irrig === 'IMMEDIATE' ? 'text-red-600' : ''}`}>{irrig}</p>
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
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CropStatusCards;
