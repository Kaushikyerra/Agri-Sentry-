import { useState, useEffect } from "react";
import { LiveAssistant } from "./LiveAssistant";
import { Button } from "@/components/ui/button";
import { Mic, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VoiceWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Only show if user is logged in
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsVisible(!!session);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setIsVisible(!!session);
        });
        return () => subscription.unsubscribe();
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Widget Container */}
            <div className={`pointer-events-auto transition-all duration-300 origin-bottom-right mb-4 ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-10 h-0 w-0 overflow-hidden"
                }`}>
                <div className="bg-white rounded-2xl shadow-xl w-80 sm:w-96 h-[500px] border border-green-100 overflow-hidden">
                    {/* Reuse LiveAssistant in Widget Mode */}
                    <LiveAssistant isWidget={true} onClose={() => setIsOpen(false)} />
                </div>
            </div>

            {/* FAB Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto rounded-full w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-transform active:scale-90 flex items-center justify-center"
                >
                    <Mic className="h-6 w-6 text-white animate-pulse" />
                </Button>
            )}
        </div>
    );
};

export default VoiceWidget;
