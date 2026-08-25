import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { BottomNav } from '../../src/components/BottomNav';
import { useHourlyReminders } from '../../src/hooks/useHourlyReminders';
import { useStore } from '../../src/state/store';

export default function TabsLayout() {
  const { state } = useStore();
  useHourlyReminders();

  if (!state.hydrated) return null;
  if (!state.illness) return <Redirect href="/onboarding/fever-start" />;

  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="fluids" options={{ title: 'Fluids' }} />
      <Tabs.Screen name="temp" options={{ title: 'Temp' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
      <Tabs.Screen name="safety" options={{ title: 'Safety' }} />
    </Tabs>
  );
}
