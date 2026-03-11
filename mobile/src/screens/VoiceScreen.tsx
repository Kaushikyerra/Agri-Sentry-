import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceScreen() {
  const [isListening, setIsListening] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Assistant</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Talk to KrishiAI</Text>
        <Text style={styles.description}>
          Ask about your farm, sensors, weather, or get farming advice in your language
        </Text>

        <TouchableOpacity 
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={() => setIsListening(!isListening)}
        >
          <Ionicons 
            name={isListening ? "mic" : "mic-outline"} 
            size={48} 
            color="#fff" 
          />
        </TouchableOpacity>

        <Text style={styles.status}>
          {isListening ? 'Listening...' : 'Tap to start'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Supported Languages</Text>
        <View style={styles.languageList}>
          <Text style={styles.language}>🇮🇳 Hindi</Text>
          <Text style={styles.language}>🇮🇳 Telugu</Text>
          <Text style={styles.language}>🇮🇳 Marathi</Text>
          <Text style={styles.language}>🇮🇳 Kannada</Text>
          <Text style={styles.language}>🇬🇧 English</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Queries</Text>
        <Text style={styles.recentItem}>• What's the soil moisture level?</Text>
        <Text style={styles.recentItem}>• When should I irrigate?</Text>
        <Text style={styles.recentItem}>• Show me today's weather</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#16a34a',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  micButtonActive: {
    backgroundColor: '#dc2626',
  },
  status: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  languageList: {
    gap: 8,
  },
  language: {
    fontSize: 14,
    color: '#374151',
    paddingVertical: 4,
  },
  recentItem: {
    fontSize: 14,
    color: '#374151',
    paddingVertical: 6,
  },
});
