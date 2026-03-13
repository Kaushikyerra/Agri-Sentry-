import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

interface LanguageSelectorProps {
  onLanguageSelect: (langCode: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect }) => {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<string>(
    localStorage.getItem('selectedLanguage') || 'en'
  );

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLang(langCode);
  };

  const handleContinue = () => {
    i18n.changeLanguage(selectedLang);
    localStorage.setItem('selectedLanguage', selectedLang);
    onLanguageSelect(selectedLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-green-100">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4 shadow-lg">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('selectLanguage')}
            </h1>
            <p className="text-gray-600">
              {t('chooseLanguage')}
            </p>
          </div>

          {/* Language Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  selectedLang === lang.code
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-lg">
                        {lang.nativeName}
                      </p>
                      <p className="text-sm text-gray-500">{lang.name}</p>
                    </div>
                  </div>
                  {selectedLang === lang.code && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('continue')} →
          </Button>

          {/* App Branding */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('appName')} • {t('tagline')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
