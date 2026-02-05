import React, { createContext, useContext, useEffect, useState } from 'react';
import { SensorData, FarmLog } from '../types';

// Extended type for simulation context
interface FarmContextType {
    currentData: SensorData; // Global/Average data (for backward compat/general weather)
    fieldData: Record<string, SensorData>; // Per-field data
    history: SensorData[];
    logs: FarmLog[];
    addLog: (log: FarmLog) => void;
    location: string;
    simulatedTime: Date; // To show the simulated clock
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

// Simulated Fields Configuration
const SIMULATED_FIELDS = ['wheat-a', 'corn-b', 'rice-c', 'soybean-d'];

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<SensorData[]>([]);
    const [currentData, setCurrentData] = useState<SensorData>({
        timestamp: new Date().toISOString(),
        soilMoisture: 65,
        ec: 1.2,
        temperature: 28,
        humidity: 60
    });

    // State to hold data for each field
    const [fieldData, setFieldData] = useState<Record<string, SensorData>>({});

    // Simulation Clock (starts at 6:00 AM)
    const [simulatedTime, setSimulatedTime] = useState(new Date().setHours(6, 0, 0, 0));

    const [logs, setLogs] = useState<FarmLog[]>([
        { id: '1', date: '2023-10-25', activity: 'Sowed Paddy (BPT 5204)', outcome: 'Germination successful' },
        { id: '2', date: '2023-11-10', activity: 'Applied Urea', outcome: 'Growth spurt observed' }
    ]);
    const location = "Guntur, Andhra Pradesh, India";

    const addLog = (log: FarmLog) => {
        setLogs(prev => [log, ...prev]);
    };

    // Initialize fields
    useEffect(() => {
        const initialData: Record<string, SensorData> = {};
        SIMULATED_FIELDS.forEach(id => {
            initialData[id] = {
                timestamp: new Date().toISOString(),
                soilMoisture: 70 + (Math.random() * 20 - 10), // Random start 60-80%
                ec: 1.0 + Math.random(),
                temperature: 25,
                humidity: 70
            };
        });
        setFieldData(initialData);
    }, []);

    // Simulation Loop
    useEffect(() => {
        const TICK_RATE = 5000; // Update every 5 seconds
        const TIME_SPEED = 1000 * 60; // Advance time by 1 minute per tick

        const interval = setInterval(() => {
            setSimulatedTime(prevTime => {
                const newTime = new Date(prevTime + TIME_SPEED);
                const hoursFloat = newTime.getHours() + newTime.getMinutes() / 60;

                // --- Physics Simulation ---

                // 1. Temperature Cycle (Sinusoidal: Coolest at 4AM, Hottest at 2PM)
                const dailyCycle = Math.sin(((hoursFloat - 9) / 24) * 2 * Math.PI);
                const ambientTemp = 25 + (dailyCycle * 8); // 17C to 33C range

                // 2. Humidity (Inverse to Temp usually)
                const ambientHum = 70 - (dailyCycle * 25); // 45% to 95%

                // Update Fields
                setFieldData(prevFields => {
                    const nextFields = { ...prevFields };

                    SIMULATED_FIELDS.forEach(id => {
                        const prev = nextFields[id] || { soilMoisture: 50, ec: 1.2 };

                        // Soil Moisture Decay (Evaporation)
                        const evaporationRate = (ambientTemp > 30 ? 0.05 : 0.01); // Reduced evaporation
                        let newMoisture = prev.soilMoisture - evaporationRate;

                        // Auto-Irrigation Simulation Trigger
                        if (newMoisture < 20) newMoisture = 20; // Maintain minimum moisture

                        // Minor noise for realism
                        const noise = (Math.random() - 0.5) * 0.2;

                        nextFields[id] = {
                            timestamp: newTime.toISOString(),
                            temperature: Number((ambientTemp + (Math.random() - 0.5)).toFixed(1)),
                            humidity: Number(Math.min(100, Math.max(30, ambientHum + (Math.random() * 2))).toFixed(1)),
                            soilMoisture: Number((newMoisture + noise).toFixed(1)),
                            ec: prev.ec
                        };
                    });

                    // Update global avg (for dashboard)
                    setCurrentData(nextFields['wheat-a'] || { ...prevFields['wheat-a'] });

                    return nextFields;
                });

                return newTime.getTime();
            });
        }, TICK_RATE);

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
