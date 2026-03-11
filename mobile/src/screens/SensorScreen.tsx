import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function SensorScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sensor Readings</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sensorName}>Temperature</Text>
        <Text style={styles.sensorValue}>28.5°C</Text>
        <Text style={styles.sensorStatus}>Normal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sensorName}>Humidity</Text>
        <Text style={styles.sensorValue}>65%</Text>
        <Text style={styles.sensorStatus}>Normal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sensorName}>Soil Moisture</Text>
        <Text style={styles.sensorValue}>45%</Text>
        <Text style={styles.sensorStatus}>Optimal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sensorName}>EC (Electrical Conductivity)</Text>
        <Text style={styles.sensorValue}>1.2 dS/m</Text>
        <Text style={styles.sensorStatus}>Good</Text>
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
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sensorValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  sensorStatus: {
    fontSize: 14,
    color: '#6b7280',
  },
});
