import React, { createContext, useContext, useEffect, useState } from 'react';
import { SensorData, FarmLog } from '../types';

// Extended type for simulation context
interface FarmContextType {
    currentData: SensorData; // Real sensor data from MQTT
    fieldData: Record<string, SensorData>; // Per-field data
    history: SensorData[];
    logs: FarmLog[];
    addLog: (log: FarmLog) => void;
    location: string;
    simulatedTime: Date;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<SensorData[]>([]);
    const [currentData, setCurrentData] = useState<SensorData>({
        timestamp: new Date().toISOString(),
        soilMoisture: 65,
        ec: 1.2,
        temperature: 28,
        humidity: 60
    });

    const [fieldData, setFieldData] = useState<Record<string, SensorData>>({});
    const [simulatedTime, setSimulatedTime] = useState(new Date());

    const [logs, setLogs] = useState<FarmLog[]>([
        { id: '1', date: '2023-10-25', activity: 'Sowed Paddy (BPT 5204)', outcome: 'Germination successful' },
        { id: '2', date: '2023-11-10', activity: 'Applied Urea', outcome: 'Growth spurt observed' }
    ]);
    const location = "Guntur, Andhra Pradesh, India";

    const addLog = (log: FarmLog) => {
        setLogs(prev => [log, ...prev]);
    };

    // Fetch real sensor data from backend
    useEffect(() => {
        const fetchSensorData = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
                const response = await fetch(`${backendUrl}/sensor-readings/latest`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.data && Array.isArray(data.data)) {
                        const readings = data.data;
                        
                        // Extract sensor values
                        const temperature = readings.find((r: any) => r.sensor_type === 'temperature')?.value || 28;
                        const humidity = readings.find((r: any) => r.sensor_type === 'humidity')?.value || 60;
                        const soilMoisture = readings.find((r: any) => r.sensor_type === 'soil_moisture')?.value || 65;
                        const ec = readings.find((r: any) => r.sensor_type === 'ec')?.value || 1.2;
                        
                        setCurrentData({
                            timestamp: new Date().toISOString(),
                            temperature: Number(temperature.toFixed(1)),
                            humidity: Number(humidity.toFixed(1)),
                            soilMoisture: Number(soilMoisture.toFixed(1)),
                            ec: Number(ec.toFixed(2))
                        });
                    }
                }
            } catch (error) {
                console.log('Error fetching sensor data:', error);
                // Keep default values if fetch fails
            }
        };

        // Fetch immediately
        fetchSensorData();
        
        // Fetch every 30 seconds for real-time updates
        const interval = setInterval(fetchSensorData, 30000);
        
        return () => clearInterval(interval);
    }, []);

    // Update simulated time
    useEffect(() => {
        const interval = setInterval(() => {
            setSimulatedTime(new Date());
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <FarmContext.Provider value={{
            currentData,
            fieldData,
            history,
            logs,
            addLog,
            location,
            simulatedTime: new Date(simulatedTime)
        }}>
            {children}
        </FarmContext.Provider>
    );
};

export const useFarm = () => {
    const context = useContext(FarmContext);
    if (!context) throw new Error("useFarm must be used within a FarmProvider");
    return context;
};
