import React from 'react';
import { AppNavigator } from '../navigation/AppNavigator';

import { useLocalSearchParams } from 'expo-router';

export default function NoorAIRoot() {
  const { query } = useLocalSearchParams();
  return <AppNavigator initialQuery={query as string} />;
}
