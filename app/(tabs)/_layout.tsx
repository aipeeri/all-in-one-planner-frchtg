
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TabLayout() {
  console.log('TabLayout: Rendering tab navigation');
  
  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'note',
      label: 'Notes',
    },
    {
      name: 'calendar',
      route: '/(tabs)/calendar',
      icon: 'calendar-today',
      label: 'Calendar',
    },
  ];

  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="calendar" name="calendar" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </ProtectedRoute>
  );
}
