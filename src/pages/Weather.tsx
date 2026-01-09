import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";

const Weather = () => {
  const [weather, setWeather] = useState({
    current: {
      temp: 28,
      condition: "Sunny",
      humidity: 65,
      windSpeed: 12,
      precipitation: 0,
      feelsLike: 30
    },
    forecast: [
      { day: "Mon", temp: 29, icon: Sun, condition: "Sunny", humidity: 60 },
      { day: "Tue", temp: 27, icon: Cloud, condition: "Cloudy", humidity: 70 },
      { day: "Wed", temp: 24, icon: CloudRain, condition: "Rainy", humidity: 85 },
      { day: "Thu", temp: 26, icon: Cloud, condition: "Cloudy", humidity: 72 },
      { day: "Fri", temp: 28, icon: Sun, condition: "Sunny", humidity: 58 },
      { day: "Sat", temp: 30, icon: Sun, condition: "Sunny", humidity: 55 },
      { day: "Sun", temp: 29, icon: Cloud, condition: "Partly Cloudy", humidity: 62 }
    ]
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Weather Forecast</h1>
          <p className="text-muted-foreground mb-8">Plan your farming activities based on weather conditions</p>

          {/* Current Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-1 border-2 border-accent/30 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-6 w-6 text-sun animate-float" />
                  Current Weather
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className="font-stats text-6xl font-bold text-sun">
                    {weather.current.temp}°C
                  </div>
                  <p className="text-xl text-muted-foreground mt-2">
                    {weather.current.condition}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Feels like {weather.current.feelsLike}°C
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-water" />
                    <div>
                      <p className="text-xs text-muted-foreground">Humidity</p>
                      <p className="font-semibold">{weather.current.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Wind</p>
                      <p className="font-semibold">{weather.current.windSpeed} km/h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendation */}
            <Card className="lg:col-span-2 border-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-6 w-6 text-primary" />
                  AI Weather Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card">
                    <CloudRain className="h-5 w-5 text-water mt-1" />
                    <div>
                      <p className="font-semibold">Rain expected in 3 hours</p>
                      <p className="text-sm text-muted-foreground">Postpone irrigation for all fields. Current soil moisture levels are adequate.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card">
                    <AlertTriangle className="h-5 w-5 text-sun mt-1" />
                    <div>
                      <p className="font-semibold">Fertilizer application window</p>
                      <p className="text-sm text-muted-foreground">Apply fertilizer before Wednesday's rain for optimal nutrient absorption.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card">
                    <Sun className="h-5 w-5 text-sun mt-1" />
                    <div>
                      <p className="font-semibold">Clear skies ahead</p>
                      <p className="text-sm text-muted-foreground">Weekend conditions perfect for harvesting activities.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 7-Day Forecast */}
          <Card className="border-2 shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-6 w-6 text-accent" />
                7-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {weather.forecast.map((day, index) => (
                  <div
                    key={day.day}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-all hover-scale"
                  >
                    <p className="text-sm font-semibold">{day.day}</p>
                    <day.icon className="h-10 w-10 text-accent animate-float" />
                    <p className="font-stats text-xl font-bold">{day.temp}°C</p>
                    <p className="text-xs text-muted-foreground text-center">{day.condition}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Droplets className="h-3 w-3" />
                      {day.humidity}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Weather;
