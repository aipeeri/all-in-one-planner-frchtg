
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

interface DietPlan {
  id: string;
  name: string;
  goal: string;
  dailyCalorieTarget?: number;
  dailyProteinTarget?: number;
  dailyWaterTarget?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  console.log('CalendarScreen: Rendering calendar screen');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dietEntries, setDietEntries] = useState<DietEntry[]>([]);
  const [activeDietPlan, setActiveDietPlan] = useState<DietPlan | null>(null);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showNewDietModal, setShowNewDietModal] = useState(false);
  const [showDietPlanSetup, setShowDietPlanSetup] = useState(false);
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

  // Diet plan setup state
  const [dietPlanName, setDietPlanName] = useState('');
  const [dietPlanGoal, setDietPlanGoal] = useState('');
  const [dietPlanCalories, setDietPlanCalories] = useState('');
  const [dietPlanProtein, setDietPlanProtein] = useState('');
  const [dietPlanWater, setDietPlanWater] = useState('');
  const [dietPlanNotes, setDietPlanNotes] = useState('');

  useEffect(() => {
    console.log('CalendarScreen: Component mounted, loading data');
    loadActiveDietPlan();
    loadAppointments();
    loadDietEntries();
  }, []);

  useEffect(() => {
    console.log('CalendarScreen: Selected date changed:', selectedDate.toISOString());
    loadAppointments();
    loadDietEntries();
  }, [selectedDate]);

  const loadActiveDietPlan = async () => {
    console.log('CalendarScreen: Loading active diet plan');
    try {
      const data = await authenticatedGet<DietPlan>('/api/diet-plans/active');
      console.log('CalendarScreen: Loaded active diet plan:', data);
      setActiveDietPlan(data);
    } catch (error) {
      console.log('CalendarScreen: No active diet plan found');
      setActiveDietPlan(null);
    }
  };

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
      
      const newAppointment = await authenticatedPost<Appointment>('/api/appointments', appointmentData);
      console.log('CalendarScreen: Created appointment:', newAppointment);
      setAppointments([...appointments, newAppointment]);
      setNewAppointmentTitle('');
      setNewAppointmentDescription('');
      setNewAppointmentTime('');
      setNewAppointmentLocation('');
      setShowNewAppointmentModal(false);
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
    } catch (error) {
      console.error('CalendarScreen: Failed to create diet entry:', error);
      Alert.alert('Error', 'Failed to create diet entry. Please try again.');
    }
  };

  const createDietPlan = async () => {
    if (!dietPlanName.trim() || !dietPlanGoal.trim()) {
      Alert.alert('Error', 'Please enter a plan name and goal');
      return;
    }
    console.log('CalendarScreen: Creating diet plan:', dietPlanName);
    try {
      const planData: any = {
        name: dietPlanName,
        goal: dietPlanGoal,
      };
      if (dietPlanCalories.trim()) {
        planData.dailyCalorieTarget = parseInt(dietPlanCalories, 10);
      }
      if (dietPlanProtein.trim()) {
        planData.dailyProteinTarget = parseInt(dietPlanProtein, 10);
      }
      if (dietPlanWater.trim()) {
        planData.dailyWaterTarget = parseInt(dietPlanWater, 10);
      }
      if (dietPlanNotes.trim()) {
        planData.notes = dietPlanNotes;
      }
      
      const newPlan = await authenticatedPost<DietPlan>('/api/diet-plans', planData);
      console.log('CalendarScreen: Created diet plan:', newPlan);
      setActiveDietPlan(newPlan);
      setDietPlanName('');
      setDietPlanGoal('');
      setDietPlanCalories('');
      setDietPlanProtein('');
      setDietPlanWater('');
      setDietPlanNotes('');
      setShowDietPlanSetup(false);
    } catch (error) {
      console.error('CalendarScreen: Failed to create diet plan:', error);
      Alert.alert('Error', 'Failed to create diet plan. Please try again.');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    console.log('CalendarScreen: User changed month:', direction > 0 ? 'next' : 'previous');
    setCurrentMonth(newMonth);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const getTotalCalories = () => {
    return dietEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  };

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: 'free-breakfast' },
    { value: 'lunch', label: 'Lunch', icon: 'restaurant' },
    { value: 'dinner', label: 'Dinner', icon: 'dinner-dining' },
    { value: 'snack', label: 'Snack', icon: 'fastfood' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth(-1)}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="chevron-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth(1)}
          >
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAYS_OF_WEEK.map((day, index) => (
              <View key={index} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.daysGrid}>
            {getDaysInMonth(currentMonth).map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !day && styles.dayCellEmpty,
                  isToday(day) && styles.dayCellToday,
                  isSelectedDate(day) && styles.dayCellSelected,
                ]}
                disabled={!day}
                onPress={() => {
                  if (day) {
                    console.log('CalendarScreen: User selected date:', day.toISOString());
                    setSelectedDate(day);
                  }
                }}
              >
                {day && (
                  <Text
                    style={[
                      styles.dayText,
                      isToday(day) && styles.dayTextToday,
                      isSelectedDate(day) && styles.dayTextSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Date Display */}
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
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
            <Text style={[styles.tabText, activeTab === 'diet' && styles.tabTextActive]}>
              Diet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'appointments' ? (
          <View style={styles.content}>
            {appointments.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={48}
                  color={colors.border}
                />
                <Text style={styles.emptyStateText}>No appointments</Text>
              </View>
            ) : (
              appointments.map((appointment, index) => (
                <View key={index} style={styles.appointmentCard}>
                  <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                  {appointment.description && (
                    <Text style={styles.appointmentDescription}>{appointment.description}</Text>
                  )}
                  {appointment.location && (
                    <View style={styles.locationRow}>
                      <IconSymbol
                        ios_icon_name="location"
                        android_material_icon_name="location-on"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.appointmentLocation}>{appointment.location}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {!activeDietPlan ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={48}
                  color={colors.border}
                />
                <Text style={styles.emptyStateText}>No diet plan</Text>
                <Text style={styles.emptyStateSubtext}>Create a diet plan to start tracking</Text>
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={() => {
                    console.log('CalendarScreen: User tapped setup diet plan');
                    setShowDietPlanSetup(true);
                  }}
                >
                  <Text style={styles.setupButtonText}>Setup Diet Plan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Diet Plan Summary */}
                <View style={styles.dietPlanCard}>
                  <View style={styles.dietPlanHeader}>
                    <View>
                      <Text style={styles.dietPlanName}>{activeDietPlan.name}</Text>
                      <Text style={styles.dietPlanGoal}>{activeDietPlan.goal}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        console.log('CalendarScreen: User tapped edit diet plan');
                        setShowDietPlanSetup(true);
                      }}
                    >
                      <IconSymbol
                        ios_icon_name="pencil"
                        android_material_icon_name="edit"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  {activeDietPlan.dailyCalorieTarget && (
                    <View style={styles.targetRow}>
                      <Text style={styles.targetLabel}>Daily Target:</Text>
                      <Text style={styles.targetValue}>
                        {getTotalCalories()} / {activeDietPlan.dailyCalorieTarget} kcal
                      </Text>
                    </View>
                  )}
                </View>

                {/* Diet Entries */}
                {dietEntries.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No meals logged</Text>
                  </View>
                ) : (
                  mealTypes.map((mealType, mealIndex) => {
                    const mealEntries = dietEntries.filter(
                      (entry) => entry.mealType === mealType.value
                    );
                    if (mealEntries.length === 0) return null;

                    return (
                      <View key={mealIndex} style={styles.mealSection}>
                        <Text style={styles.mealTitle}>{mealType.label}</Text>
                        {mealEntries.map((entry, entryIndex) => (
                          <View key={entryIndex} style={styles.dietEntry}>
                            <Text style={styles.dietEntryName}>{entry.foodName}</Text>
                            {entry.calories && (
                              <Text style={styles.dietEntryCalories}>{entry.calories} kcal</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}
              </>
            )}
          </View>
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
            if (!activeDietPlan) {
              Alert.alert('Setup Required', 'Please setup your diet plan first');
              setShowDietPlanSetup(true);
            } else {
              setShowNewDietModal(true);
            }
          }
        }}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={24}
          color={colors.backgroundAlt}
        />
      </TouchableOpacity>

      {/* New Appointment Modal */}
      <Modal
        visible={showNewAppointmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewAppointmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Appointment</Text>
              <TouchableOpacity onPress={() => setShowNewAppointmentModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
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
              placeholder="Location"
              placeholderTextColor={colors.textSecondary}
              value={newAppointmentLocation}
              onChangeText={setNewAppointmentLocation}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={createAppointment}>
              <Text style={styles.primaryButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Diet Entry Modal */}
      <Modal
        visible={showNewDietModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewDietModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Meal</Text>
              <TouchableOpacity onPress={() => setShowNewDietModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            
            {/* Meal Type Selector */}
            <View style={styles.mealTypeSelector}>
              {mealTypes.map((mealType, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.mealTypeButton,
                    newDietMealType === mealType.value && styles.mealTypeButtonActive,
                  ]}
                  onPress={() => {
                    console.log('CalendarScreen: User selected meal type:', mealType.value);
                    setNewDietMealType(mealType.value as any);
                  }}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      newDietMealType === mealType.value && styles.mealTypeTextActive,
                    ]}
                  >
                    {mealType.label}
                  </Text>
                </TouchableOpacity>
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
              placeholder="Calories"
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
            <TouchableOpacity style={styles.primaryButton} onPress={createDietEntry}>
              <Text style={styles.primaryButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Diet Plan Setup Modal */}
      <Modal
        visible={showDietPlanSetup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDietPlanSetup(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Diet Plan Setup</Text>
                <TouchableOpacity onPress={() => setShowDietPlanSetup(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Plan Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Weight Loss Plan"
                placeholderTextColor={colors.textSecondary}
                value={dietPlanName}
                onChangeText={setDietPlanName}
              />
              
              <Text style={styles.inputLabel}>Goal</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Lose weight, Gain muscle, Maintain"
                placeholderTextColor={colors.textSecondary}
                value={dietPlanGoal}
                onChangeText={setDietPlanGoal}
              />
              
              <Text style={styles.inputLabel}>Daily Calorie Target (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2000"
                placeholderTextColor={colors.textSecondary}
                value={dietPlanCalories}
                onChangeText={setDietPlanCalories}
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Daily Protein Target (g, optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 150"
                placeholderTextColor={colors.textSecondary}
                value={dietPlanProtein}
                onChangeText={setDietPlanProtein}
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Daily Water Target (ml, optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2000"
                placeholderTextColor={colors.textSecondary}
                value={dietPlanWater}
                onChangeText={setDietPlanWater}
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any additional notes about your diet plan"
                placeholderTextColor={colors.textSecondary}
                value={dietPlanNotes}
                onChangeText={setDietPlanNotes}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity style={styles.primaryButton} onPress={createDietPlan}>
                <Text style={styles.primaryButtonText}>Save Plan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendar: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayCellToday: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: colors.backgroundAlt,
    fontWeight: '700',
  },
  selectedDateHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  tabTextActive: {
    color: colors.backgroundAlt,
  },
  content: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  setupButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.backgroundAlt,
  },
  appointmentCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  appointmentTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  appointmentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
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
  dietPlanCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dietPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dietPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dietPlanGoal: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dietEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  dietEntryName: {
    fontSize: 15,
    color: colors.text,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  mealTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  mealTypeTextActive: {
    color: colors.backgroundAlt,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.backgroundAlt,
  },
});
