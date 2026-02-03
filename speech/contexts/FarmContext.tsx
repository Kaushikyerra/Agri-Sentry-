import React, { createContext, useContext, useEffect, useState } from 'react';
import { SensorData, FarmLog } from '../types';

interface FarmContextType {
  currentData: SensorData;
  history: SensorData[];
  logs: FarmLog[];
  addLog: (log: FarmLog) => void;
  location: string;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData>({
    timestamp: new Date().toISOString(),
    soilMoisture: 65,
    ec: 1.2,
    temperature: 30,
    humidity: 70
  });
  const [logs, setLogs] = useState<FarmLog[]>([
    { id: '1', date: '2023-10-25', activity: 'Sowed Paddy (BPT 5204)', outcome: 'Germination successful' },
    { id: '2', date: '2023-11-10', activity: 'Applied Urea', outcome: 'Growth spurt observed' }
  ]);
  const location = "Guntur, Andhra Pradesh, India";

  const addLog = (log: FarmLog) => {
    setLogs(prev => [log, ...prev]);
  };

  // Simulate sensor data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentData(prev => {
        // Random walk simulation
        const newMoisture = Math.max(0, Math.min(100, prev.soilMoisture + (Math.random() - 0.5) * 5));
        const newTemp = Math.max(20, Math.min(45, prev.temperature + (Math.random() - 0.5) * 2));
        const newHumidity = Math.max(30, Math.min(90, prev.humidity + (Math.random() - 0.5) * 5));
        
        const newData = {
          timestamp: new Date().toISOString(),
          soilMoisture: Number(newMoisture.toFixed(1)),
          ec: prev.ec, // Stable usually
          temperature: Number(newTemp.toFixed(1)),
          humidity: Number(newHumidity.toFixed(1))
        };
        
        setHistory(h => {
          const newHistory = [...h, newData];
          if (newHistory.length > 20) newHistory.shift();
          return newHistory;
        });
        
        return newData;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <FarmContext.Provider value={{ currentData, history, logs, addLog, location }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) throw new Error("useFarm must be used within a FarmProvider");
  return context;
};