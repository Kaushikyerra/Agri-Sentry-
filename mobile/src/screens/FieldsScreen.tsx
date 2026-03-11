import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Picker,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://10.21.135.117:8000';

const SOIL_TYPES = ['Loamy', 'Clay', 'Sandy', 'Silty', 'Peaty'];
const CROP_TYPES = ['Wheat', 'Rice', 'Corn', 'Cotton', 'Sugarcane', 'Vegetables', 'Fruits'];

export default function FieldsScreen() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    crop_type: 'Wheat',
    soil_type: 'Loamy',
    planting_date: new Date().toISOString().split('T')[0],
    expected_harvest_date: '',
    area_sqm: '',
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/fields`, {
        headers: { Authorization: 'Bearer YOUR_TOKEN' },
      });
      setFields(response.data.data || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!formData.name || !formData.area_sqm) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/fields`,
        {
          name: formData.name,
          crop_type: formData.crop_type,
          soil_type: formData.soil_type,
          planting_date: formData.planting_date,
          expected_harvest_date: formData.expected_harvest_date,
          geojson_boundary: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          },
        },
        {
          headers: { Authorization: 'Bearer YOUR_TOKEN' },
        }
      );

      setFields([...fields, response.data.field]);
      setShowModal(false);
      setFormData({
        name: '',
        crop_type: 'Wheat',
        soil_type: 'Loamy',
        planting_date: new Date().toISOString().split('T')[0],
        expected_harvest_date: '',
        area_sqm: '',
      });
      Alert.alert('Success', 'Field added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add field');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    Alert.alert('Delete Field', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/fields/${fieldId}`, {
              headers: { Authorization: 'Bearer YOUR_TOKEN' },
            });
            setFields(fields.filter(f => f.id !== fieldId));
            Alert.alert('Success', 'Field deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete field');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Fields</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {fields.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No fields added yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first field</Text>
          </View>
        ) : (
          fields.map(field => (
            <View key={field.id} style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <View>
                  <Text style={styles.fieldName}>{field.name}</Text>
                  <Text style={styles.fieldCrop}>{field.crop_type}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteField(field.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Area:</Text>
                  <Text style={styles.detailValue}>
                    {field.area_sqm ? `${(field.area_sqm / 4047).toFixed(2)} acres` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Soil Type:</Text>
                  <Text style={styles.detailValue}>{field.soil_type || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Planted:</Text>
                  <Text style={styles.detailValue}>{field.planting_date || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expected Harvest:</Text>
                  <Text style={styles.detailValue}>{field.expected_harvest_date || 'N/A'}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Field</Text>
            <TouchableOpacity onPress={handleAddField}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Field Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., North Field"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.label}>Crop Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.crop_type}
                onValueChange={value => setFormData({ ...formData, crop_type: value })}
              >
                {CROP_TYPES.map(crop => (
                  <Picker.Item key={crop} label={crop} value={crop} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Soil Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.soil_type}
                onValueChange={value => setFormData({ ...formData, soil_type: value })}
              >
                {SOIL_TYPES.map(soil => (
                  <Picker.Item key={soil} label={soil} value={soil} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Area (sq meters) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 20000"
              value={formData.area_sqm}
              onChangeText={text => setFormData({ ...formData, area_sqm: text })}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Planting Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.planting_date}
              onChangeText={text => setFormData({ ...formData, planting_date: text })}
            />

            <Text style={styles.label}>Expected Harvest Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.expected_harvest_date}
              onChangeText={text => setFormData({ ...formData, expected_harvest_date: text })}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fieldName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  fieldCrop: {
    fontSize: 14,
    color: '#16a34a',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  fieldDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
});
