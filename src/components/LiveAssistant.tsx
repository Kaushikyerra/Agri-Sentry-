import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFarm } from '@/contexts/FarmContext';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, XCircle, Sparkles } from 'lucide-react';
import { arrayBufferToBase64, decodeAudioData } from '@/utils/audioUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PCM_WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (input && input[0] && input[0].length > 0) {
            this.port.postMessage(input[0].slice());
        }
        return true;
    }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export const LiveAssistant: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { currentData, location } = useFarm();
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isAIResponding, setIsAIResponding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const sessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const isUserClosingRef = useRef(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const stopConnection = () => {
        isUserClosingRef.current = true;

        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch (e) { }
            sessionRef.current = null;
        }

        if (workletNodeRef.current) {
            try { workletNodeRef.current.disconnect(); } catch (e) { }
            workletNodeRef.current = null;
        }
        if (sourceRef.current) {
            try { sourceRef.current.disconnect(); } catch (e) { }
            sourceRef.current = null;
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
            try { src.stop(); } catch (e) { }
        });
        sourcesRef.current.clear();

        setIsConnected(false);
        setIsSpeaking(false);
        setIsAIResponding(false);
    };

    const startConnection = async () => {
        setError(null);
        isUserClosingRef.current = false;
        try {
            if (!apiKey) throw new Error("API Key not found. Set VITE_GEMINI_API_KEY in .env");

            const ai = new GoogleGenAI({ apiKey });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const workletBlob = new Blob([PCM_WORKLET_CODE], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(workletBlob);
            await inputAudioContextRef.current.audioWorklet.addModule(workletUrl);
            URL.revokeObjectURL(workletUrl);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const languageInstructions: { [key: string]: string } = {
                'hi': 'Speak ONLY in Hindi (हिंदी). Use Devanagari script.',
                'te': 'Speak ONLY in Telugu (తెలుగు). Use Telugu script.',
                'ta': 'Speak ONLY in Tamil (தமிழ்). Use Tamil script.',
                'ml': 'Speak ONLY in Malayalam (മലയാളം). Use Malayalam script.',
                'kn': 'Speak ONLY in Kannada (ಕನ್ನಡ). Use Kannada script.',
                'pa': 'Speak ONLY in Punjabi (ਪੰਜਾਬੀ). Use Gurmukhi script.',
                'en': 'Speak in English.',
            };

            const currentLanguage = i18n.language || 'en';
            const languageInstruction = languageInstructions[currentLanguage] || languageInstructions['en'];

            const systemInstruction = `
        You are 'Kisan Sahayak' (किसान सहायक), a friendly and expert agricultural assistant for a farmer in ${location}.
        
        CRITICAL LANGUAGE INSTRUCTION: ${languageInstruction}
        DO NOT mix languages. Respond ENTIRELY in the specified language.
        
        Current Field Conditions:
        - Soil Moisture: ${currentData.soilMoisture}%
        - Temperature: ${currentData.temperature}°C
        - Humidity: ${currentData.humidity}%
        - EC: ${currentData.ec} dS/m
        
        Capabilities:
        1. Give practical advice on irrigation, pests, and market prices.
        2. Be concise, encouraging, and speak naturally in the farmer's language.
        3. Use simple agricultural terms that farmers understand.
      `;

            const session = await ai.live.connect({
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
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            setIsAIResponding(true);
                            try {
                                const ctx = outputAudioContextRef.current;
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                                const audioBuffer = await decodeAudioData(
                                    base64ToUint8Array(base64Audio),
                                    ctx
                                );

                                const bufferSource = ctx.createBufferSource();
                                bufferSource.buffer = audioBuffer;
                                bufferSource.connect(ctx.destination);

                                bufferSource.onended = () => {
                                    sourcesRef.current.delete(bufferSource);
                                    if (sourcesRef.current.size === 0) setIsAIResponding(false);
                                };

                                bufferSource.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(bufferSource);
                            } catch (err) {
                                console.error("Audio decode error", err);
                            }
                        }

                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(src => src.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setIsAIResponding(false);
                        }
                    },
                    onclose: (e: any) => {
                        console.log("Session closed", e?.reason);
                        if (!isUserClosingRef.current) {
                            const reason = e?.reason || "Connection closed by server";
                            setError(`Session ended: ${reason}. Please try again.`);
                        }
                        setIsConnected(false);
                        setIsSpeaking(false);
                        setIsAIResponding(false);
                    },
                    onerror: (err: any) => {
                        console.error("Session error", err);
                        setError("Connection error. Please retry.");
                        stopConnection();
                    }
                }
            });

            sessionRef.current = session;

            if (!inputAudioContextRef.current || !streamRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;

            const workletNode = new AudioWorkletNode(inputAudioContextRef.current, 'pcm-processor');
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (e) => {
                const inputData: Float32Array = e.data;

                const vol = inputData.reduce((acc, val) => acc + Math.abs(val), 0) / inputData.length;
                setIsSpeaking(vol > 0.01);

                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }
                const base64Data = arrayBufferToBase64(int16.buffer);

                if (sessionRef.current) {
                    sessionRef.current.sendRealtimeInput({
                        audio: {
                            data: base64Data,
                            mimeType: 'audio/pcm;rate=16000',
                        }
                    });
                }
            };

            source.connect(workletNode);
            workletNode.connect(inputAudioContextRef.current.destination);

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to start assistant");
            stopConnection();
        }
    };

    function base64ToUint8Array(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    useEffect(() => {
        return () => {
            stopConnection();
        };
    }, []);

    return (
        <Card className={`border-2 transition-all duration-500 overflow-hidden ${isConnected
            ? "border-green-400 bg-gradient-to-br from-green-50 to-white shadow-glow"
            : "border-primary/20 hover:border-primary/40 bg-card"
            }`}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className={`w-5 h-5 ${isConnected ? "text-green-600 animate-pulse" : "text-primary"}`} />
                    {t('voiceAssistant')}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected
                        ? isAIResponding
                            ? "bg-gradient-to-tr from-green-400 to-green-300 shadow-[0_0_30px_rgba(34,197,94,0.6)] scale-110"
                            : isSpeaking
                                ? "bg-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105"
                                : "bg-green-100 border-4 border-green-200"
                        : "bg-secondary/10"
                        }`}>
                        {isConnected ? (
                            isAIResponding ? (
                                <Volume2 className="w-12 h-12 text-white animate-bounce" />
                            ) : (
                                <Mic className={`w-12 h-12 transition-colors ${isSpeaking ? "text-blue-500" : "text-green-600"}`} />
                            )
                        ) : (
                            <MicOff className="w-12 h-12 text-muted-foreground" />
                        )}
                    </div>

                    <div className="mt-4 h-6">
                        {isConnected && (
                            <span className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${isAIResponding ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                }`}>
                                {isAIResponding ? t('speaking') : t('listening')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    {!isConnected ? (
                        <Button
                            onClick={startConnection}
                            className="w-full bg-gradient-earth hover:opacity-90 transition-all shadow-md text-white font-semibold py-6 text-lg rounded-xl"
                        >
                            <Mic className="w-5 h-5 mr-2" />
                            {t('startConversation')}
                        </Button>
                    ) : (
                        <Button
                            onClick={stopConnection}
                            variant="destructive"
                            className="w-full shadow-md py-6 text-lg rounded-xl"
                        >
                            <XCircle className="w-5 h-5 mr-2" />
                            {t('endCall')}
                        </Button>
                    )}

                    {error && (
                        <p className="text-destructive text-sm text-center mt-2 bg-destructive/10 p-2 rounded">
                            {error}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
