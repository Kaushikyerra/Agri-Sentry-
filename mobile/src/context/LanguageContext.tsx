import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  hi: { name: 'हिंदी', flag: '🇮🇳' },
  te: { name: 'తెలుగు', flag: '🇮🇳' },
  mr: { name: 'मराठी', flag: '🇮🇳' },
  kn: { name: 'ಕನ್ನಡ', flag: '🇮🇳' },
};

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    sensors: 'Sensors',
    fields: 'Fields',
    assistant: 'Assistant',
    profile: 'Profile',
    home: 'Home',
    logout: 'Logout',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    noData: 'No data available',
    refresh: 'Refresh',
    settings: 'Settings',
    language: 'Language',
    selectLanguage: 'Select Language',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    sensors: 'सेंसर',
    fields: 'खेत',
    assistant: 'सहायक',
    profile: 'प्रोफाइल',
    home: 'होम',
    logout: 'लॉगआउट',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफल',
    noData: 'कोई डेटा उपलब्ध नहीं',
    refresh: 'रीफ्रेश करें',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
  },
  te: {
    dashboard: 'డ్యాష్‌బోర్డ్',
    sensors: 'సెన్సార్‌లు',
    fields: 'పొలాలు',
    assistant: 'సహాయకుడు',
    profile: 'ప్రొఫైల్',
    home: 'హోమ్',
    logout: 'లాగ్‌అవుట్',
    loading: 'లోడ్ అవుతోంది...',
    error: 'లోపం',
    success: 'విజయం',
    noData: 'డేటా లేదు',
    refresh: 'రిఫ్రెష్ చేయండి',
    settings: 'సెట్టింగ్‌లు',
    language: 'భాష',
    selectLanguage: 'భాష ఎంచుకోండి',
  },
  mr: {
    dashboard: 'डॅशबोर्ड',
    sensors: 'सेंसर',
    fields: 'शेत',
    assistant: 'सहायक',
    profile: 'प्रोफाइल',
    home: 'होम',
    logout: 'लॉगआउट',
    loading: 'लोड होत आहे...',
    error: 'त्रुटी',
    success: 'यशस्वी',
    noData: 'डेटा उपलब्ध नाही',
    refresh: 'रीफ्रेश करा',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    selectLanguage: 'भाषा निवडा',
  },
  kn: {
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    sensors: 'ಸೆನ್ಸರ್‌ಗಳು',
    fields: 'ಹೊಲಗಳು',
    assistant: 'ಸಹಾಯಕ',
    profile: 'ಪ್ರೊಫೈಲ್',
    home: 'ಮನೆ',
    logout: 'ಲಾಗ್‌ಔಟ್',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    error: 'ದೋಷ',
    success: 'ಯಶಸ್ವಿ',
    noData: 'ಡೇಟಾ ಲೇ',
    refresh: 'ರಿಫ್ರೆಶ್ ಮಾಡಿ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    language: 'ಭಾಷೆ',
    selectLanguage: 'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load language from Supabase profile
    const loadLanguage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('primary_language')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.primary_language) {
            setLanguageState(profile.primary_language);
          }
        }
      } catch (error) {
        console.log('Error loading language:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    
    // Save to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ primary_language: lang })
          .eq('id', session.user.id);
      }
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language as keyof typeof TRANSLATIONS]?.[key as keyof typeof TRANSLATIONS.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
