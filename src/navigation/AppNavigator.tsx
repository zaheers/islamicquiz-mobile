import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { AnswerScreen } from '../screens/AnswerScreen';
import { SurahDetailScreen } from '../screens/SurahDetailScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = ({ initialQuery }: { initialQuery?: string }) => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator
          id="NoorStack"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={BottomTabs} 
            initialParams={initialQuery ? { initialQuery } : undefined} 
          />
          <Stack.Screen name="Answer" component={AnswerScreen} />
          <Stack.Screen name="SurahDetail" component={SurahDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};
