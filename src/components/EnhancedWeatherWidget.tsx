import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react';
import { getCurrentWeather, getWeatherIcon, WeatherData } from '@/services/weatherService';

interface EnhancedWeatherWidgetProps {
  location?: string;
  lat?: number;
  lon?: number;
}

export const EnhancedWeatherWidget: React.FC<EnhancedWeatherWidgetProps> = ({ 
  location = 'Pune', 
  lat, 
  lon 
}) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [lat, lon, location]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let weatherData: WeatherData;
      
      if (lat && lon) {
        const { getCurrentWeather } = await import('@/services/weatherService');
        weatherData = await getCurrentWeather(lat, lon);
      } else {
        const { getWeatherByCity } = await import('@/services/weatherService');
        weatherData = await getWeatherByCity(location);
      }
      
      setWeather(weatherData);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherCondition = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return 'rainy';
    if (desc.includes('cloud')) return 'cloudy';
    return 'sunny';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-blue-200 rounded w-1/2"></div>
            <div className="h-12 bg-blue-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0">
        <CardContent className="p-6 text-center text-gray-500">
          <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{error || 'Weather unavailable'}</p>
        </CardContent>
      </Card>
    );
  }

  const condition = getWeatherCondition(weather.description);
  const gradients = {
    sunny: 'from-orange-100 to-yellow-100',
    cloudy: 'from-gray-100 to-blue-100',
    rainy: 'from-blue-100 to-indigo-100',
  };

  return (
    <Card className={`bg-gradient-to-br ${gradients[condition]} border-0 shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left: Temperature and Icon */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {condition === 'sunny' && <Sun className="w-16 h-16 text-orange-500 animate-pulse" />}
              {condition === 'cloudy' && <Cloud className="w-16 h-16 text-gray-500" />}
              {condition === 'rainy' && <CloudRain className="w-16 h-16 text-blue-500" />}
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-800">
                {weather.temp}°C
              </div>
              <p className="text-sm text-gray-600 capitalize mt-1">
                {weather.description}
              </p>
            </div>
          </div>

          {/* Right: Weather Details */}
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-gray-600">
                <Droplets className="w-4 h-4 inline mr-1" />
                {weather.humidity}%
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-gray-600">
                <Wind className="w-4 h-4 inline mr-1" />
                {weather.wind_speed} km/h
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-gray-600">
                <CloudRain className="w-4 h-4 inline mr-1" />
                {Math.round(weather.rain_probability)}%
              </span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-4 pt-3 border-t border-gray-300/30">
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
