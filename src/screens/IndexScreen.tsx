import React from 'react';
import { View, StyleSheet, Image, ScrollView, Button } from 'react-native';
import Navigation from '../components/Navigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // Adjust path if App.tsx is elsewhere
import { useUserSettings } from '../hooks/useUserSettings'; // Assuming path is correct

// Assuming the logo is in assets/rhythmk-logo-trans.png
const logo = require('../../assets/rhythmk-logo-trans.png');

type IndexScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Index'>;

const IndexScreen = () => {
  const navigation = useNavigation<IndexScreenNavigationProp>();
  const { settings } = useUserSettings();
  // Determine if there's an active plan based on user settings
  // This logic might need adjustment based on how 'raceGoal' and 'fitnessLevel' are stored
  const hasActivePlan = Boolean(settings.raceGoal && settings.raceGoal.type && settings.fitnessLevel);

  // For now, we assume the user is always onboarded when reaching IndexScreen.
  // Onboarding flow would typically be handled before this screen is mounted,
  // e.g., by a conditional navigator in App.tsx.

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      {/* Navigation is always shown if IndexScreen is reached */}
      <View style={styles.navigationContainer}>
        <Navigation hasActivePlan={hasActivePlan} />
      </View>

      <View style={styles.actionButtonContainer}>
        <Button 
          title="Log New Activity"
          onPress={() => navigation.navigate('LogActivity')}
          color="#3b82f6" // A blue color, similar to blue-500
        />
        <View style={{ marginTop: 10 }} /> {/* Add some space */}
        <Button 
          title="View Activity History"
          onPress={() => navigation.navigate('ActivityHistory')}
          color="#10b981" // An emerald/green color
        />
      </View>

      {/* 
        The main content area is now handled by the respective screens navigated to.
        IndexScreen itself doesn't render varying content here anymore.
        If there's default content for the 'Index' route specifically (like a welcome message
        or quick stats before navigating), it could be added here.
        For now, it's just the header and navigation.
      */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#111827', // Dark background, similar to slate-900
  },
  container: {
    alignItems: 'center',
    paddingBottom: 70, // Ensure space for back button
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1e3a8a', // A blueish color, similar to blue-900
    marginBottom: 10,
  },
  logo: {
    width: 180,
    height: 70,
  },
  actionButtonContainer: {
    width: '80%', // Make button reasonably wide
    marginTop: 20,
    marginBottom: 20,
  },
  navigationContainer: {
    width: '100%',
    paddingHorizontal: 16, // Consistent horizontal padding
    marginBottom: 10,
  },
  mainContent: {
    width: '100%',
    paddingHorizontal: 10,
  },
  infoText: {
    color: 'white',
    textAlign: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 30,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

export default IndexScreen;

