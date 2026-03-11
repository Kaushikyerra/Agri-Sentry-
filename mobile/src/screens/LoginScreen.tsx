import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  hi: { name: 'हिंदी', flag: '🇮🇳' },
  te: { name: 'తెలుగు', flag: '🇮🇳' },
  mr: { name: 'मराठी', flag: '🇮🇳' },
  kn: { name: 'ಕನ್ನಡ', flag: '🇮🇳' },
};

const CROPS = {
  en: ['Wheat', 'Rice', 'Corn', 'Cotton', 'Sugarcane', 'Vegetables'],
  hi: ['गेहूं', 'चावल', 'मक्का', 'कपास', 'गन्ना', 'सब्जियां'],
  te: ['గోధుమ', 'వరి', 'మొక్క', '棉', 'చెరకు', 'కూరగాయలు'],
  mr: ['गहू', 'तांदूळ', 'कॉर्न', 'कापूस', 'ऊस', 'भाज्या'],
  kn: ['ಗೋಧಿ', 'ಅಕ್ಕಿ', 'ಜೋಳ', 'ಹತ್ತಿ', 'ಕಬ್ಬು', 'ತರಕಾರಿ'],
};

const CROP_VALUES = ['wheat', 'rice', 'corn', 'cotton', 'sugarcane', 'vegetables'];

const TRANSLATIONS = {
  en: {
    selectLanguage: 'Select Your Language',
    phoneNumber: 'Phone Number',
    enterPhone: 'Enter phone number (+91...)',
    sendOTP: 'Send OTP',
    sending: 'Sending...',
    enterOTP: 'Enter OTP',
    enterOTPCode: 'Enter 6-digit OTP',
    selectCrop: 'Primary Crop',
    verifyOTP: 'Verify OTP',
    verifying: 'Verifying...',
    changePhone: 'Change phone number',
    success: 'Success',
    error: 'Error',
    otpSent: 'OTP sent to your phone',
    loginSuccess: 'Login successful',
    invalidOTP: 'Invalid OTP',
    networkError: 'Network error',
    backendNotRunning: 'Backend not running',
  },
  hi: {
    selectLanguage: 'अपनी भाषा चुनें',
    phoneNumber: 'फोन नंबर',
    enterPhone: 'फोन नंबर दर्ज करें (+91...)',
    sendOTP: 'OTP भेजें',
    sending: 'भेज रहे हैं...',
    enterOTP: 'OTP दर्ज करें',
    enterOTPCode: '6 अंकों का OTP दर्ज करें',
    selectCrop: 'प्राथमिक फसल',
    verifyOTP: 'OTP सत्यापित करें',
    verifying: 'सत्यापन जारी है...',
    changePhone: 'फोन नंबर बदलें',
    success: 'सफल',
    error: 'त्रुटि',
    otpSent: 'OTP आपके फोन पर भेजा गया',
    loginSuccess: 'लॉगिन सफल',
    invalidOTP: 'अमान्य OTP',
    networkError: 'नेटवर्क त्रुटि',
    backendNotRunning: 'बैकएंड चल नहीं रहा है',
  },
  te: {
    selectLanguage: 'మీ భాషను ఎంచుకోండి',
    phoneNumber: 'ఫోన్ నంబర్',
    enterPhone: 'ఫోన్ నంబర్ నమోదు చేయండి (+91...)',
    sendOTP: 'OTP పంపండి',
    sending: 'పంపుతున్నాము...',
    enterOTP: 'OTP నమోదు చేయండి',
    enterOTPCode: '6 అంకెల OTP నమోదు చేయండి',
    selectCrop: 'ప్రధాన పంట',
    verifyOTP: 'OTP ధృవీకరించండి',
    verifying: 'ధృవీకరిస్తున్నాము...',
    changePhone: 'ఫోన్ నంబర్ మార్చండి',
    success: 'విజయం',
    error: 'లోపం',
    otpSent: 'OTP మీ ఫోన్‌కు పంపబడింది',
    loginSuccess: 'లాగిన్ విజయవంతమైంది',
    invalidOTP: 'చెల్లని OTP',
    networkError: 'నెట్‌వర్క్ లోపం',
    backendNotRunning: 'బ్యాకెండ్ నడుస్తున్నది కాదు',
  },
  mr: {
    selectLanguage: 'आपली भाषा निवडा',
    phoneNumber: 'फोन नंबर',
    enterPhone: 'फोन नंबर प्रविष्ट करा (+91...)',
    sendOTP: 'OTP पाठवा',
    sending: 'पाठवत आहे...',
    enterOTP: 'OTP प्रविष्ट करा',
    enterOTPCode: '6 अंकांचा OTP प्रविष्ट करा',
    selectCrop: 'प्राथमिक पीक',
    verifyOTP: 'OTP सत्यापित करा',
    verifying: 'सत्यापन सुरू आहे...',
    changePhone: 'फोन नंबर बदला',
    success: 'यशस्वी',
    error: 'त्रुटी',
    otpSent: 'OTP आपल्या फोनला पाठवला गेला',
    loginSuccess: 'लॉगिन यशस्वी',
    invalidOTP: 'अमान्य OTP',
    networkError: 'नेटवर्क त्रुटी',
    backendNotRunning: 'बॅकएंड चालू नाही',
  },
  kn: {
    selectLanguage: 'ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
    phoneNumber: 'ಫೋನ್ ಸಂಖ್ಯೆ',
    enterPhone: 'ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (+91...)',
    sendOTP: 'OTP ಕಳುಹಿಸಿ',
    sending: 'ಕಳುಹಿಸುತ್ತಿದೆ...',
    enterOTP: 'OTP ನಮೂದಿಸಿ',
    enterOTPCode: '6 ಅಂಕಿಯ OTP ನಮೂದಿಸಿ',
    selectCrop: 'ಪ್ರಾಥಮಿಕ ಬೆಳೆ',
    verifyOTP: 'OTP ಪರಿಶೀಲಿಸಿ',
    verifying: 'ಪರಿಶೀಲಿಸುತ್ತಿದೆ...',
    changePhone: 'ಫೋನ್ ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ',
    success: 'ಯಶಸ್ವಿ',
    error: 'ದೋಷ',
    otpSent: 'OTP ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    loginSuccess: 'ಲಾಗಿನ್ ಯಶಸ್ವಿ',
    invalidOTP: 'ಅಮಾನ್ಯ OTP',
    networkError: 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ',
    backendNotRunning: 'ಬ್ಯಾಕೆಂಡ್ ಚಾಲನೆಯಲ್ಲಿಲ್ಲ',
  },
};

const API_URL = 'http://10.21.135.117:8000';

export default function LoginScreen() {
  const [step, setStep] = useState('language'); // language -> phone -> otp
  const [language, setLanguage] = useState(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [primaryCrop, setPrimaryCrop] = useState(0); // Index, not name
  const [showCropMenu, setShowCropMenu] = useState(false);

  const t = language ? TRANSLATIONS[language] : TRANSLATIONS.en;

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setStep('phone');
  };

  const handleSendOTP = async () => {
    if (!phone) {
      Alert.alert(t.error, 'Please enter phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('otp');
        Alert.alert(t.success, t.otpSent);
      } else {
        Alert.alert(t.error, data.detail || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert(t.error, t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert(t.error, 'Please enter OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone,
          otp_code: otp,
          name: 'Farmer User',
          primary_language: language,
          primary_crop: CROP_VALUES[primaryCrop],
        }),
      });

      const data = await response.json();
      console.log('Verify OTP response:', data);

      if (response.ok) {
        // Get email and password from backend response
        const email = data.email;
        const password = data.password;
        
        console.log('Attempting to sign in with:', email);
        
        // Sign in with the credentials from backend
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        console.log('Sign in response:', { signInData, signInError });
        
        if (signInError) {
          console.log('Sign in error:', signInError);
          Alert.alert(t.error, 'Failed to create session: ' + signInError.message);
          setLoading(false);
          return;
        }
        
        if (signInData && signInData.session) {
          console.log('Session created successfully:', signInData.session.user.id);
          
          // Wait a moment for session to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify session is set
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          console.log('Current session after sign in:', currentSession?.user.id);
          
          Alert.alert(t.success, t.loginSuccess);
          // Navigation will happen automatically when session is detected
        } else {
          console.log('No session in response');
          Alert.alert(t.error, 'Session not created');
          setLoading(false);
        }
      } else {
        Alert.alert(t.error, data.detail || t.invalidOTP);
        setLoading(false);
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert(t.error, t.networkError);
      setLoading(false);
    }
  };

  // Step 1: Language Selection
  if (step === 'language') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>KrishiAI</Text>
          <Text style={styles.subtitle}>Smart Agriculture</Text>
        </View>

        <View style={styles.languageContainer}>
          <Text style={styles.languageTitle}>Select Your Language</Text>
          <View style={styles.languageGrid}>
            {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
              <TouchableOpacity
                key={code}
                style={styles.languageButton}
                onPress={() => handleLanguageSelect(code)}
              >
                <Text style={styles.languageFlag}>{flag}</Text>
                <Text style={styles.languageName}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Step 2: Phone Number
  if (step === 'phone') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>KrishiAI</Text>
          <Text style={styles.subtitle}>{LANGUAGES[language].name}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t.phoneNumber}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.enterPhone}
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t.sending : t.sendOTP}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep('language')}>
            <Text style={styles.link}>← {t.selectLanguage}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Step 3: OTP Verification
  if (step === 'otp') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>KrishiAI</Text>
          <Text style={styles.subtitle}>{LANGUAGES[language].name}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t.enterOTP}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.enterOTPCode}
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />

          <Text style={styles.label}>{t.selectCrop}</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCropMenu(!showCropMenu)}
          >
            <Text style={styles.dropdownButtonText}>
              {CROPS[language][primaryCrop]} ▼
            </Text>
          </TouchableOpacity>
          {showCropMenu && (
            <View style={styles.menu}>
              {CROPS[language].map((crop, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    setPrimaryCrop(index);
                    setShowCropMenu(false);
                  }}
                >
                  <Text style={styles.menuItemText}>{crop}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t.verifying : t.verifyOTP}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep('phone')}>
            <Text style={styles.link}>← {t.changePhone}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#16a34a',
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#dcfce7',
  },
  languageContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  languageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 30,
    textAlign: 'center',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  languageButton: {
    width: '45%',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  languageFlag: {
    fontSize: 40,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  menu: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 14,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#16a34a',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});
