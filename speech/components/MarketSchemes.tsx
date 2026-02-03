import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { TrendingUp, FileText, ExternalLink, Loader2 } from 'lucide-react';

export const MarketSchemes: React.FC = () => {
  const [marketData, setMarketData] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Parallel requests for better speed
        const [marketRes, schemeRes] = await Promise.all([
             ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: "What are the current market prices (in INR/Quintal) for Rice, Cotton, and Chilli in Andhra Pradesh markets today? Format as a concise list.",
                config: { tools: [{ googleSearch: {} }] }
             }),
             ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: "List 3 key agricultural government schemes for farmers in Andhra Pradesh active right now. Include one sentence description for each.",
                config: { tools: [{ googleSearch: {} }] }
             })
        ]);

        setMarketData(marketRes.text);
        setSchemes(schemeRes.text);
      } catch (e) {
        console.error("Failed to fetch data", e);
        setMarketData("Unable to fetch live market prices at the moment.");
        setSchemes("Unable to fetch schemes at the moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 pb-20 space-y-6">
       <header className="mb-4">
        <h2 className="text-2xl font-bold text-green-800">Market & Schemes</h2>
        <p className="text-gray-600 text-sm">Real-time insights powered by Google Search.</p>
      </header>

      {/* Market Prices */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">Mandi Prices (Live)</h3>
        </div>
        
        {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {marketData}
            </div>
        )}
      </div>

      {/* Schemes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
        <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">Govt. Schemes</h3>
        </div>

        {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-purple-500" /></div>
        ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {schemes}
            </div>
        )}
      </div>
      
      <div className="text-xs text-center text-gray-400 mt-8">
        Data retrieved via Gemini Search Grounding. Verify with local authorities.
      </div>
    </div>
  );
};