import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer } from "lucide-react";

const weatherData = {
  current: {
    temp: 28,
    condition: "Sunny",
    humidity: 65,
    windSpeed: 12,
    precipitation: 0,
  },
  forecast: [
    { day: "Mon", temp: 29, icon: Sun, condition: "Sunny" },
    { day: "Tue", temp: 27, icon: Cloud, condition: "Cloudy" },
    { day: "Wed", temp: 24, icon: CloudRain, condition: "Rainy" },
    { day: "Thu", temp: 26, icon: Cloud, condition: "Cloudy" },
    { day: "Fri", temp: 28, icon: Sun, condition: "Sunny" },
    { day: "Sat", temp: 30, icon: Sun, condition: "Sunny" },
    { day: "Sun", temp: 29, icon: Cloud, condition: "Partly Cloudy" },
  ],
};

const WeatherDashboard = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Weather Analysis
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Weather */}
          <Card className="lg:col-span-1 border-2 border-accent/30 shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-6 w-6 text-sun animate-float" />
                Current Weather
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <div className="font-stats text-6xl font-bold text-sun">
                  {weatherData.current.temp}°C
                </div>
                <p className="text-xl text-muted-foreground mt-2">
                  {weatherData.current.condition}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-water" />
                  <div>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                    <p className="font-semibold">{weatherData.current.humidity}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Wind</p>
                    <p className="font-semibold">{weatherData.current.windSpeed} km/h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Forecast */}
          <Card className="lg:col-span-2 border-2 shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-6 w-6 text-accent" />
                7-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weatherData.forecast.map((day, index) => (
                  <div
                    key={day.day}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors hover-scale"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <p className="text-sm font-semibold">{day.day}</p>
                    <day.icon className="h-8 w-8 text-accent animate-float" />
                    <p className="font-stats text-lg font-bold">{day.temp}°C</p>
                    <p className="text-xs text-muted-foreground text-center hidden md:block">
                      {day.condition}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Alert */}
        <Card className="mt-6 border-2 border-water/30 bg-water/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CloudRain className="h-6 w-6 text-water animate-drop" />
              <div>
                <p className="font-semibold">Weather Alert</p>
                <p className="text-sm text-muted-foreground">
                  Rain expected on Wednesday. Consider postponing fertilization activities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WeatherDashboard;
