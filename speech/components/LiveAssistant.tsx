import React, { useEffect, useRef, useState } from 'react';
import { useFarm } from '../contexts/FarmContext';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, Loader2, XCircle } from 'lucide-react';
import { createPcmBlob, decodeAudioData } from '../utils/audioUtils';

export const LiveAssistant: React.FC = () => {
  const { currentData, location } = useFarm();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // User speaking
  const [isAIResponding, setIsAIResponding] = useState(false); // AI speaking
  const [error, setError] = useState<string | null>(null);

  // Refs for audio handling
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Ref for cleanup
  const sessionRef = useRef<any>(null); // To store session object
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const apiKey = process.env.API_KEY;

  const stopConnection = () => {
    if (sessionRef.current) {
        // There isn't a direct "close" method on the promise result easily accessible 
        // without keeping the session object. We rely on closing the stream and contexts 
        // to naturally end the flow.
        // But optimally we should close the websocket if exposed.
        // For this demo, we assume closing contexts cleans up.
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    setIsConnected(false);
    setIsSpeaking(false);
    setIsAIResponding(false);
  };

  const startConnection = async () => {
    setError(null);
    try {
      if (!apiKey) throw new Error("API Key not found");
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const systemInstruction = `
        You are 'Kisan Sahayak', a friendly and expert agricultural assistant for a farmer in ${location}.
        Current Field Conditions:
        - Soil Moisture: ${currentData.soilMoisture}%
        - Temperature: ${currentData.temperature}°C
        - Humidity: ${currentData.humidity}%
        - EC: ${currentData.ec} dS/m
        
        Capabilities:
        1. Speak in Telugu, Hindi, or English based on the user's language.
        2. Give practical advice on irrigation, pests, and market prices (simulated).
        3. Be concise and encouraging.
      `;

      // Establish Connection
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setIsConnected(true);

            // Setup Input Stream
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;
            
            // ScriptProcessor is deprecated but widely supported for this raw PCM access pattern in demos
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then(session => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
              
              // Simple VAD visualization
              const vol = inputData.reduce((acc, val) => acc + Math.abs(val), 0) / inputData.length;
              setIsSpeaking(vol > 0.01);
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                setIsAIResponding(true);
                try {
                    const ctx = outputAudioContextRef.current;
                    // Sync start time
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(
                        base64ToUint8Array(base64Audio),
                        ctx
                    );

                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);
                    
                    source.onended = () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) setIsAIResponding(false);
                    };

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                } catch (err) {
                    console.error("Audio decode error", err);
                }
             }

             // Handle Interruption
             if (message.serverContent?.interrupted) {
                 console.log("Interrupted");
                 sourcesRef.current.forEach(src => src.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
                 setIsAIResponding(false);
             }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Session error", err);
            setError("Connection error. Please retry.");
            stopConnection();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to start assistant");
    }
  };

  // Helper for base64 decode needed inside component to avoid import issues if any
  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConnection();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 bg-gradient-to-b from-green-50 to-white rounded-xl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-green-800">Voice Assistant</h2>
        <p className="text-gray-600">Speak in Telugu, Hindi, or English</p>
      </div>

      <div className="relative">
        {/* Visualizer Circle */}
        <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${
            isConnected 
                ? isAIResponding 
                    ? "bg-green-100 shadow-[0_0_40px_rgba(34,197,94,0.4)] scale-110" 
                    : isSpeaking 
                        ? "bg-blue-100 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                        : "bg-green-50 border-4 border-green-200"
                : "bg-gray-100"
        }`}>
            {isConnected ? (
                isAIResponding ? <Volume2 className="w-16 h-16 text-green-600 animate-pulse" /> : <Mic className={`w-16 h-16 ${isSpeaking ? "text-blue-500" : "text-green-600"}`} />
            ) : (
                <MicOff className="w-16 h-16 text-gray-400" />
            )}
        </div>
        
        {/* Status Badge */}
        {isConnected && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md text-xs font-semibold text-green-700 border border-green-100">
                {isAIResponding ? "Listening..." : "Listening..."} {/* Simplified logic, real logic handles duplex */}
            </div>
        )}
      </div>

      <div className="space-y-4 w-full max-w-xs">
        {!isConnected ? (
            <button 
                onClick={startConnection}
                className="w-full flex items-center justify-center py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-lg shadow-lg transition-transform active:scale-95"
            >
                <Mic className="w-6 h-6 mr-2" />
                Start Conversation
            </button>
        ) : (
            <button 
                onClick={stopConnection}
                className="w-full flex items-center justify-center py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg shadow-lg transition-transform active:scale-95"
            >
                <XCircle className="w-6 h-6 mr-2" />
                End Call
            </button>
        )}
        
        {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                {error}
            </div>
        )}
      </div>

      <div className="text-xs text-gray-400 text-center max-w-sm">
        Powered by Gemini Live API (gemini-2.5-flash-native-audio). <br/>
        Provides real-time, low-latency speech interaction.
      </div>
    </div>
  );
};