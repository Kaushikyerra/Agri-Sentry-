const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  rain_probability: number;
}

export interface ForecastData {
  date: string;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
  rain_probability: number;
}

export const getCurrentWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      rain_probability: data.clouds?.all || 0,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

export const getWeatherForecast = async (lat: number, lon: number): Promise<ForecastData[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    
    const data = await response.json();
    
    // Group by date and get daily forecast
    const dailyForecasts: { [key: string]: any[] } = {};
    
    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = [];
      }
      dailyForecasts[date].push(item);
    });
    
    // Get next 5 days
    const forecast: ForecastData[] = Object.keys(dailyForecasts)
      .slice(0, 5)
      .map(date => {
        const dayData = dailyForecasts[date];
        const temps = dayData.map(d => d.main.temp);
        const midDayData = dayData[Math.floor(dayData.length / 2)];
        
        return {
          date,
          temp_max: Math.round(Math.max(...temps)),
          temp_min: Math.round(Math.min(...temps)),
          description: midDayData.weather[0].description,
          icon: midDayData.weather[0].icon,
          rain_probability: midDayData.pop * 100, // Probability of precipitation
        };
      });
    
    return forecast;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
};

export const getWeatherByCity = async (city: string): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed * 3.6),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      rain_probability: data.clouds?.all || 0,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

export const getWeatherIcon = (iconCode: string): string => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};
