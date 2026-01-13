
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  reminderMinutes?: number;
  createdAt: string;
}

interface DietEntry {
  id: string;
  folderId?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories?: number;
  notes?: string;
  date: string;
  createdAt: string;
}

interface DietFolder {
  id: string;
  name: string;
  type: string;
  color?: string;
  icon?: string;
}

export default function CalendarScreen() {
  console.log('CalendarScreen: Rendering calendar and diet screen');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dietEntries, setDietEntries] = useState<DietEntry[]>([]);
  const [dietFolders, setDietFolders] = useState<DietFolder[]>([]);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showNewDietModal, setShowNewDietModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'diet'>('appointments');

  // Appointment form state
  const [newAppointmentTitle, setNewAppointmentTitle] = useState('');
  const [newAppointmentDescription, setNewAppointmentDescription] = useState('');
  const [newAppointmentTime, setNewAppointmentTime] = useState('');
  const [newAppointmentLocation, setNewAppointmentLocation] = useState('');

  // Diet form state
  const [newDietMealType, setNewDietMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [newDietFoodName, setNewDietFoodName] = useState('');
  const [newDietCalories, setNewDietCalories] = useState('');
  const [newDietNotes, setNewDietNotes] = useState('');

  useEffect(() => {
    console.log('CalendarScreen: Component mounted, loading data');
    loadAppointments();
    loadDietEntries();
    loadDietFolders();
  }, []);

  useEffect(() => {
    console.log('CalendarScreen: Selected date changed:', selectedDate.toISOString());
    loadAppointments();
    loadDietEntries();
  }, [selectedDate]);

  const loadAppointments = async () => {
    console.log('CalendarScreen: Loading appointments from API');
    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      const data = await authenticatedGet<Appointment[]>(
        `/api/appointments?startDate=${dateStr}&endDate=${dateStr}`
      );
      console.log('CalendarScreen: Loaded appointments:', data);
      setAppointments(data);
    } catch (error) {
      console.error('CalendarScreen: Failed to load appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDietEntries = async () => {
    console.log('CalendarScreen: Loading diet entries from API');
    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      const data = await authenticatedGet<DietEntry[]>(
        `/api/diet?startDate=${dateStr}&endDate=${dateStr}`
      );
      console.log('CalendarScreen: Loaded diet entries:', data);
      setDietEntries(data);
    } catch (error) {
      console.error('CalendarScreen: Failed to load diet entries:', error);
      Alert.alert('Error', 'Failed to load diet entries. Please try again.');
    }
  };

  const loadDietFolders = async () => {
    console.log('CalendarScreen: Loading diet folders from API');
    try {
      const data = await authenticatedGet<DietFolder[]>('/api/folders?type=diet');
      console.log('CalendarScreen: Loaded diet folders:', data);
      setDietFolders(data);
    } catch (error) {
      console.error('CalendarScreen: Failed to load diet folders:', error);
      // Don't show error alert for folders as it's not critical
    }
  };

  const createAppointment = async () => {
    if (!newAppointmentTitle.trim()) {
      Alert.alert('Error', 'Please enter an appointment title');
      return;
    }
    console.log('CalendarScreen: Creating new appointment:', newAppointmentTitle);
    const dateStr = selectedDate.toISOString();
    try {
      const appointmentData: any = {
        title: newAppointmentTitle,
        date: dateStr,
      };
      if (newAppointmentDescription.trim()) {
        appointmentData.description = newAppointmentDescription;
      }
      if (newAppointmentLocation.trim()) {
        appointmentData.location = newAppointmentLocation;
      }
      // Note: time is stored in the description or as part of the date field
      // The backend expects ISO date string
      
      const newAppointment = await authenticatedPost<Appointment>('/api/appointments', appointmentData);
      console.log('CalendarScreen: Created appointment:', newAppointment);
      setAppointments([...appointments, newAppointment]);
      setNewAppointmentTitle('');
      setNewAppointmentDescription('');
      setNewAppointmentTime('');
      setNewAppointmentLocation('');
      setShowNewAppointmentModal(false);
      Alert.alert('Success', 'Appointment created successfully!');
    } catch (error) {
      console.error('CalendarScreen: Failed to create appointment:', error);
      Alert.alert('Error', 'Failed to create appointment. Please try again.');
    }
  };

  const createDietEntry = async () => {
    if (!newDietFoodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }
    console.log('CalendarScreen: Creating new diet entry:', newDietFoodName);
    const dateStr = selectedDate.toISOString();
    try {
      const dietData: any = {
        mealType: newDietMealType,
        foodName: newDietFoodName,
        date: dateStr,
      };
      if (newDietCalories.trim()) {
        dietData.calories = parseInt(newDietCalories, 10);
      }
      if (newDietNotes.trim()) {
        dietData.notes = newDietNotes;
      }
      
      const newEntry = await authenticatedPost<DietEntry>('/api/diet', dietData);
      console.log('CalendarScreen: Created diet entry:', newEntry);
      setDietEntries([...dietEntries, newEntry]);
      setNewDietFoodName('');
      setNewDietCalories('');
      setNewDietNotes('');
      setShowNewDietModal(false);
      Alert.alert('Success', 'Diet entry added successfully!');
    } catch (error) {
      console.error('CalendarScreen: Failed to create diet entry:', error);
      Alert.alert('Error', 'Failed to create diet entry. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    console.log('CalendarScreen: User changed date by', days, 'days');
    setSelectedDate(newDate);
  };

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: 'free-breakfast' },
    { value: 'lunch', label: 'Lunch', icon: 'restaurant' },
    { value: 'dinner', label: 'dinner', icon: 'dinner-dining' },
    { value: 'snack', label: 'Snack', icon: 'fastfood' },
  ];

  const getTotalCalories = () => {
    return dietEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar & Diet</Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            console.log('CalendarScreen: User tapped previous day');
            changeDate(-1);
          }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="chevron-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateDisplay}
          onPress={() => {
            console.log('CalendarScreen: User tapped date picker');
            setShowDatePicker(true);
          }}
        >
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="calendar-today"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            console.log('CalendarScreen: User tapped next day');
            changeDate(1);
          }}
        >
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => {
            console.log('CalendarScreen: User switched to appointments tab');
            setActiveTab('appointments');
          }}
        >
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="event"
            size={20}
            color={activeTab === 'appointments' ? colors.backgroundAlt : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'appointments' && styles.tabTextActive,
            ]}
          >
            Appointments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diet' && styles.tabActive]}
          onPress={() => {
            console.log('CalendarScreen: User switched to diet tab');
            setActiveTab('diet');
          }}
        >
          <IconSymbol
            ios_icon_name="fork.knife"
            android_material_icon_name="restaurant"
            size={20}
            color={activeTab === 'diet' ? colors.backgroundAlt : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'diet' && styles.tabTextActive]}>
            Diet Plan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'appointments' ? (
          <>
            {appointments.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={64}
                  color={colors.border}
                />
                <Text style={styles.emptyStateText}>No appointments</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button to add an appointment
                </Text>
              </View>
            ) : (
              appointments.map((appointment, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.appointmentCard}
                    onPress={() => {
                      console.log('CalendarScreen: User tapped appointment:', appointment.title);
                      Alert.alert(
                        appointment.title,
                        `${appointment.description || ''}\n\n${appointment.time || ''}\n${appointment.location || ''}`
                      );
                    }}
                  >
                    <View style={styles.appointmentHeader}>
                      <View style={styles.appointmentIcon}>
                        <IconSymbol
                          ios_icon_name="calendar"
                          android_material_icon_name="event"
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                        {appointment.time && (
                          <Text style={styles.appointmentTime}>{appointment.time}</Text>
                        )}
                        {appointment.location && (
                          <View style={styles.locationRow}>
                            <IconSymbol
                              ios_icon_name="location"
                              android_material_icon_name="location-on"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.appointmentLocation}>
                              {appointment.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              ))
            )}
          </>
        ) : (
          <>
            {/* Calorie Summary */}
            {dietEntries.length > 0 && (
              <View style={styles.calorieCard}>
                <Text style={styles.calorieLabel}>Total Calories</Text>
                <Text style={styles.calorieValue}>{getTotalCalories()}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
            )}

            {/* Diet Entries by Meal Type */}
            {mealTypes.map((mealType, mealIndex) => {
              const mealEntries = dietEntries.filter(
                (entry) => entry.mealType === mealType.value
              );
              if (mealEntries.length === 0) return null;

              return (
                <React.Fragment key={mealIndex}>
                  <View key={mealType.value} style={styles.mealSection}>
                    <View style={styles.mealHeader}>
                      <IconSymbol
                        ios_icon_name="fork.knife"
                        android_material_icon_name={mealType.icon}
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.mealTitle}>{mealType.label}</Text>
                    </View>
                    {mealEntries.map((entry, entryIndex) => (
                      <React.Fragment key={entryIndex}>
                        <View key={entry.id} style={styles.dietEntry}>
                          <View style={styles.dietEntryInfo}>
                            <Text style={styles.dietEntryName}>{entry.foodName}</Text>
                            {entry.notes && (
                              <Text style={styles.dietEntryNotes}>{entry.notes}</Text>
                            )}
                          </View>
                          {entry.calories && (
                            <Text style={styles.dietEntryCalories}>
                              {entry.calories} kcal
                            </Text>
                          )}
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </React.Fragment>
              );
            })}

            {dietEntries.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={64}
                  color={colors.border}
                />
                <Text style={styles.emptyStateText}>No diet entries</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button to log your meals
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          console.log('CalendarScreen: User tapped add button');
          if (activeTab === 'appointments') {
            setShowNewAppointmentModal(true);
          } else {
            setShowNewDietModal(true);
          }
        }}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={28}
          color={colors.backgroundAlt}
        />
      </TouchableOpacity>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              console.log('CalendarScreen: User selected date:', date.toISOString());
              setSelectedDate(date);
            }
          }}
        />
      )}

      {/* New Appointment Modal */}
      <Modal
        visible={showNewAppointmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewAppointmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Appointment</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={colors.textSecondary}
              value={newAppointmentTitle}
              onChangeText={setNewAppointmentTitle}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={newAppointmentDescription}
              onChangeText={setNewAppointmentDescription}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (e.g., 2:00 PM)"
              placeholderTextColor={colors.textSecondary}
              value={newAppointmentTime}
              onChangeText={setNewAppointmentTime}
            />
            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor={colors.textSecondary}
              value={newAppointmentLocation}
              onChangeText={setNewAppointmentLocation}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('CalendarScreen: User cancelled appointment creation');
                  setShowNewAppointmentModal(false);
                  setNewAppointmentTitle('');
                  setNewAppointmentDescription('');
                  setNewAppointmentTime('');
                  setNewAppointmentLocation('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={createAppointment}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Diet Entry Modal */}
      <Modal
        visible={showNewDietModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewDietModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Diet Entry</Text>
            
            {/* Meal Type Selector */}
            <View style={styles.mealTypeSelector}>
              {mealTypes.map((mealType, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    key={mealType.value}
                    style={[
                      styles.mealTypeButton,
                      newDietMealType === mealType.value && styles.mealTypeButtonActive,
                    ]}
                    onPress={() => {
                      console.log('CalendarScreen: User selected meal type:', mealType.value);
                      setNewDietMealType(mealType.value as any);
                    }}
                  >
                    <IconSymbol
                      ios_icon_name="fork.knife"
                      android_material_icon_name={mealType.icon}
                      size={20}
                      color={
                        newDietMealType === mealType.value
                          ? colors.backgroundAlt
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.mealTypeText,
                        newDietMealType === mealType.value && styles.mealTypeTextActive,
                      ]}
                    >
                      {mealType.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Food name"
              placeholderTextColor={colors.textSecondary}
              value={newDietFoodName}
              onChangeText={setNewDietFoodName}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Calories (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newDietCalories}
              onChangeText={setNewDietCalories}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newDietNotes}
              onChangeText={setNewDietNotes}
              multiline
              numberOfLines={2}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('CalendarScreen: User cancelled diet entry creation');
                  setShowNewDietModal(false);
                  setNewDietFoodName('');
                  setNewDietCalories('');
                  setNewDietNotes('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={createDietEntry}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dateButton: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.backgroundAlt,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentLocation: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calorieCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 4px 12px rgba(99, 102, 241, 0.2)',
    elevation: 3,
  },
  calorieLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.backgroundAlt,
    opacity: 0.9,
    marginBottom: 8,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.backgroundAlt,
  },
  calorieUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.backgroundAlt,
    opacity: 0.9,
    marginTop: 4,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dietEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dietEntryInfo: {
    flex: 1,
  },
  dietEntryName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  dietEntryNotes: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dietEntryCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(99, 102, 241, 0.4)',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  mealTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mealTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  mealTypeTextActive: {
    color: colors.backgroundAlt,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonCreate: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.backgroundAlt,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
