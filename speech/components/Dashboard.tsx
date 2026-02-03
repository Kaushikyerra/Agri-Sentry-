import React from 'react';
import { useFarm } from '../contexts/FarmContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Thermometer, Zap, CloudRain, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentData, history, location } = useFarm();

  const getMoistureStatus = (val: number) => {
    if (val < 40) return { text: 'Low - Irrigate Now', color: 'text-red-600' };
    if (val > 80) return { text: 'High - Drain Field', color: 'text-orange-600' };
    return { text: 'Optimal', color: 'text-green-600' };
  };

  const moistureStatus = getMoistureStatus(currentData.soilMoisture);

  return (
    <div className="space-y-6 pb-20">
      <header className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
        <h1 className="text-2xl font-bold text-green-800">My Farm Dashboard</h1>
        <p className="text-gray-500 text-sm flex items-center mt-1">
          <CloudRain className="w-4 h-4 mr-1" />
          {location}
        </p>
      </header>

      {/* Real-time Sensor Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
          <Droplets className="w-8 h-8 text-blue-500 mb-2" />
          <span className="text-sm text-gray-600">Soil Moisture</span>
          <span className="text-2xl font-bold text-blue-800">{currentData.soilMoisture}%</span>
          <span className={`text-xs font-medium mt-1 ${moistureStatus.color}`}>{moistureStatus.text}</span>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
          <Thermometer className="w-8 h-8 text-orange-500 mb-2" />
          <span className="text-sm text-gray-600">Temperature</span>
          <span className="text-2xl font-bold text-orange-800">{currentData.temperature}°C</span>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center text-center">
          <Zap className="w-8 h-8 text-purple-500 mb-2" />
          <span className="text-sm text-gray-600">EC (Salinity)</span>
          <span className="text-2xl font-bold text-purple-800">{currentData.ec} dS/m</span>
        </div>

        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 flex flex-col items-center justify-center text-center">
          <Activity className="w-8 h-8 text-teal-500 mb-2" />
          <span className="text-sm text-gray-600">Humidity</span>
          <span className="text-2xl font-bold text-teal-800">{currentData.humidity}%</span>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Soil Moisture Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="soilMoisture" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advisory Section */}
      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
        <h3 className="text-lg font-bold text-green-900 mb-2">Today's Advisory</h3>
        <div className="space-y-2 text-green-800 text-sm">
          <p>• <strong>Irrigation:</strong> {currentData.soilMoisture < 45 ? "Consider watering your crop this evening." : "Soil moisture is sufficient. No irrigation needed today."}</p>
          <p>• <strong>Fertilization:</strong> EC levels are stable. Maintain current nutrient schedule for Paddy.</p>
          <p>• <strong>Weather:</strong> High chance of light showers in Guntur district tomorrow.</p>
        </div>
      </div>
    </div>
  );
};