import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './src/lib/supabase';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import SensorScreen from './src/screens/SensorScreen';
import VoiceScreen from './src/screens/VoiceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FieldsScreen from './src/screens/FieldsScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DashboardMain" 
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const SensorStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="SensorMain" 
      component={SensorScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const FieldsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="FieldsMain" 
      component={FieldsScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const VoiceStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="VoiceMain" 
      component={VoiceScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const AppTabs = () => {
  const { t } = useLanguage();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Sensors') {
            iconName = focused ? 'pulse' : 'pulse-outline';
          } else if (route.name === 'Fields') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Voice') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{ title: t('dashboard') }}
      />
      <Tab.Screen 
        name="Sensors" 
        component={SensorStack}
        options={{ title: t('sensors') }}
      />
      <Tab.Screen 
        name="Fields" 
        component={FieldsStack}
        options={{ title: t('fields') }}
      />
      <Tab.Screen 
        name="Voice" 
        component={VoiceStack}
        options={{ title: t('assistant') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: t('profile') }}
      />
    </Tab.Navigator>
  );
};

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App: Checking initial session...');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: Initial session:', session?.user?.id || 'No session');
      setSession(session);
      setLoading(false);
    }).catch(error => {
      console.log('App: Error getting session:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App: Auth state changed:', _event, session?.user?.id || 'No session');
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  console.log('App: Rendering', session ? 'AppTabs' : 'LoginScreen');

  return (
    <NavigationContainer>
      {session ? <AppTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
