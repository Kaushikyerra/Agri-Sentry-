export interface SensorData {
  timestamp: string;
  soilMoisture: number; // percentage
  ec: number; // dS/m
  temperature: number; // Celsius
  humidity: number; // percentage
}

export interface FarmLog {
  id: string;
  date: string;
  activity: string;
  outcome: string;
}

export interface Scheme {
  name: string;
  description: string;
  eligibility: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ASSISTANT = 'ASSISTANT',
  PEST_DETECTOR = 'PEST_DETECTOR',
  MARKET = 'MARKET'
}

export interface MarketPrice {
  crop: string;
  price: number; // INR per quintal
  trend: 'up' | 'down' | 'stable';
}
