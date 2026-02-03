import React, { useState } from 'react';
import { FarmProvider } from './contexts/FarmContext';
import { Dashboard } from './components/Dashboard';
import { LiveAssistant } from './components/LiveAssistant';
import { PestDetector } from './components/PestDetector';
import { MarketSchemes } from './components/MarketSchemes';
import { LayoutDashboard, Mic, Bug, Store } from 'lucide-react';
import { AppView } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);

  return (
    <FarmProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full bg-white shadow-xl min-h-screen relative">
            {view === AppView.DASHBOARD && <Dashboard />}
            {view === AppView.ASSISTANT && <LiveAssistant />}
            {view === AppView.PEST_DETECTOR && <PestDetector />}
            {view === AppView.MARKET && <MarketSchemes />}
        </main>

        {/* Sticky Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-center p-2">
                <button 
                    onClick={() => setView(AppView.DASHBOARD)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === AppView.DASHBOARD ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                >
                    <LayoutDashboard className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Farm</span>
                </button>
                
                <button 
                    onClick={() => setView(AppView.ASSISTANT)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === AppView.ASSISTANT ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                >
                    <div className={`${view === AppView.ASSISTANT ? 'bg-green-100' : ''} p-2 rounded-full -mt-6 bg-white border border-gray-100 shadow-sm`}>
                        <Mic className="w-8 h-8 text-green-600" />
                    </div>
                    <span className="text-[10px] font-medium mt-1">Assistant</span>
                </button>
                
                <button 
                    onClick={() => setView(AppView.PEST_DETECTOR)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === AppView.PEST_DETECTOR ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                >
                    <Bug className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Dr. Crop</span>
                </button>

                <button 
                    onClick={() => setView(AppView.MARKET)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === AppView.MARKET ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                >
                    <Store className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Market</span>
                </button>
            </div>
        </nav>
      </div>
    </FarmProvider>
  );
};

export default App;