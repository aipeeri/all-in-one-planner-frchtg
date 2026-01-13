
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';
import { useRouter } from 'expo-router';

interface Stats {
  notesCount: number;
  appointmentsCount: number;
  foldersCount: number;
  dietEntriesCount: number;
}

export default function ProfileScreen() {
  console.log('ProfileScreen: Rendering profile screen');
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    notesCount: 0,
    appointmentsCount: 0,
    foldersCount: 0,
    dietEntriesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Load all data to calculate statistics
      const [notes, appointments, folders, dietEntries] = await Promise.all([
        authenticatedGet<any[]>('/api/notes'),
        authenticatedGet<any[]>('/api/appointments'),
        authenticatedGet<any[]>('/api/folders'),
        authenticatedGet<any[]>('/api/diet'),
      ]);
      
      setStats({
        notesCount: notes.length,
        appointmentsCount: appointments.length,
        foldersCount: folders.length,
        dietEntriesCount: dietEntries.length,
      });
    } catch (error) {
      console.error('ProfileScreen: Failed to load stats:', error);
      // Don't show error alert, just keep zeros
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('ProfileScreen: Sign out failed:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person.circle.fill"
              android_material_icon_name="account-circle"
              size={80}
              color={colors.primary}
            />
          </View>
          <Text style={styles.name}>{user?.name || user?.email || 'Planning Pro'}</Text>
          <Text style={styles.subtitle}>Organize your life</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol
              ios_icon_name="arrow.right.square"
              android_material_icon_name="logout"
              size={20}
              color={colors.error}
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={loadStats}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="note.text"
                  android_material_icon_name="description"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.statValue}>{stats.notesCount}</Text>
                <Text style={styles.statLabel}>Notes</Text>
              </View>

              <View style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={32}
                  color={colors.secondary}
                />
                <Text style={styles.statValue}>{stats.appointmentsCount}</Text>
                <Text style={styles.statLabel}>Appointments</Text>
              </View>

              <View style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="folder.fill"
                  android_material_icon_name="folder"
                  size={32}
                  color={colors.accent}
                />
                <Text style={styles.statValue}>{stats.foldersCount}</Text>
                <Text style={styles.statLabel}>Folders</Text>
              </View>

              <View style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={32}
                  color={colors.success}
                />
                <Text style={styles.statValue}>{stats.dietEntriesCount}</Text>
                <Text style={styles.statLabel}>Diet Entries</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Your all-in-one planning app for organizing notes, studies,
              appointments, and diet plans. Keep everything in one place and
              stay on top of your goals.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="note.text"
              android_material_icon_name="description"
              size={24}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Notes & Studies</Text>
              <Text style={styles.featureDescription}>
                Organize your research and notes with folders, tags, and media
                attachments
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={24}
              color={colors.secondary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Calendar & Appointments</Text>
              <Text style={styles.featureDescription}>
                Schedule appointments with reminders and location tracking
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="fork.knife"
              android_material_icon_name="restaurant"
              size={24}
              color={colors.success}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Diet Planning</Text>
              <Text style={styles.featureDescription}>
                Track your meals and calories with organized diet folders
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="photo"
              android_material_icon_name="image"
              size={24}
              color={colors.accent}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Media Support</Text>
              <Text style={styles.featureDescription}>
                Add photos and videos to your notes for better organization
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
