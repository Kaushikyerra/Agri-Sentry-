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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const TASK_TYPES = ['Irrigation', 'Fertilization', 'Spraying', 'Harvesting', 'Plowing', 'Weeding', 'Custom'];

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'Irrigation',
    scheduled_at: new Date().toISOString().split('T')[0],
    weather_dependent: false,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: 'Bearer YOUR_TOKEN' },
      });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/tasks`,
        formData,
        {
          headers: { Authorization: 'Bearer YOUR_TOKEN' },
        }
      );

      setTasks([...tasks, response.data.data]);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        task_type: 'Irrigation',
        scheduled_at: new Date().toISOString().split('T')[0],
        weather_dependent: false,
      });
      Alert.alert('Success', 'Task added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await axios.post(
        `${API_URL}/tasks/${taskId}/complete`,
        {},
        {
          headers: { Authorization: 'Bearer YOUR_TOKEN' },
        }
      );

      setTasks(tasks.filter(t => t.id !== taskId));
      Alert.alert('Success', 'Task marked as complete');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Farm Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {pendingTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pending Tasks ({pendingTasks.length})</Text>
            {pendingTasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskType}>{task.task_type}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteTask(task.id)}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                  </TouchableOpacity>
                </View>
                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}
                <View style={styles.taskFooter}>
                  <Text style={styles.taskDate}>{task.scheduled_at}</Text>
                  {task.weather_dependent && (
                    <View style={styles.weatherTag}>
                      <Ionicons name="cloud" size={12} color="#fff" />
                      <Text style={styles.weatherTagText}>Weather Dependent</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {completedTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed ({completedTasks.length})</Text>
            {completedTasks.map(task => (
              <View key={task.id} style={[styles.taskCard, styles.completedCard]}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, styles.completedText]}>{task.title}</Text>
                    <Text style={styles.taskType}>{task.task_type}</Text>
                  </View>
                  <Ionicons name="checkmark-done" size={24} color="#10b981" />
                </View>
              </View>
            ))}
          </>
        )}

        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first task</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Task</Text>
            <TouchableOpacity onPress={handleAddTask}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Irrigate North Field"
              value={formData.title}
              onChangeText={text => setFormData({ ...formData, title: text })}
            />

            <Text style={styles.label}>Task Type</Text>
            <View style={styles.pickerContainer}>
              {TASK_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.task_type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, task_type: type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.task_type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes..."
              value={formData.description}
              onChangeText={text => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Scheduled Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.scheduled_at}
              onChangeText={text => setFormData({ ...formData, scheduled_at: text })}
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Weather Dependent</Text>
              <Switch
                value={formData.weather_dependent}
                onValueChange={value =>
                  setFormData({ ...formData, weather_dependent: value })
                }
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={formData.weather_dependent ? '#16a34a' : '#f3f4f6'}
              />
            </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 16,
  },
  taskCard: {
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
  completedCard: {
    backgroundColor: '#f0fdf4',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskType: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 4,
  },
  taskDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  taskDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  weatherTag: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  weatherTagText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  completeButton: {
    padding: 8,
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
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9fafb',
  },
  typeButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
});
