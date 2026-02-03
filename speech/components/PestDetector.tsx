import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Camera, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export const PestDetector: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                { text: "Identify the crop and any pest or disease in this image. Provide a diagnosis and organic remedies suitable for Indian agriculture. Keep it concise." }
            ]
        }
      });
      
      setResult(response.text || "Could not analyze image.");
    } catch (error) {
      console.error(error);
      setResult("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-20 space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-green-800">Pest & Disease Doctor</h2>
        <p className="text-gray-600 text-sm">Upload a photo of your affected crop for instant AI diagnosis.</p>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
        {image ? (
            <div className="relative w-full mb-4">
                <img src={image} alt="Crop" className="w-full h-64 object-cover rounded-lg" />
                <button 
                    onClick={() => { setImage(null); setResult(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                    <XCircle className="w-5 h-5" />
                </button>
            </div>
        ) : (
            <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 mb-4">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Tap to upload photo</span>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                />
            </div>
        )}

        <button
            onClick={analyzeImage}
            disabled={!image || loading}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center ${
                !image || loading ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
            {loading ? "Analyzing..." : "Diagnose Crop"}
        </button>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Diagnosis Report
            </h3>
            <div className="prose prose-green prose-sm max-w-none text-gray-700">
                {/* Simple markdown rendering simulation */}
                {result.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
import { XCircle } from 'lucide-react';
