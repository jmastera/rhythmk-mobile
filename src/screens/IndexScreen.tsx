import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, PlayCircle, Target, TrendingUp, Calendar, Settings as SettingsIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // Adjust path if App.tsx is elsewhere
import { useUserSettings } from '../hooks/useUserSettings'; // Assuming path is correct
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRaceColor } from '../utils/raceColors';
import { HeaderSafeArea } from '../components/HeaderSafeArea';

// Assuming the logo is in assets/rhythmk-logo-trans.png
const logo = require('../../assets/rhythmk-logo-trans.png');

interface CardDataItem {
  id: string;
  title: string;
  icon: React.ElementType; // Lucide icons are components
  description: string;
  navigateTo?: keyof RootStackParamList; // Make it optional and typed
  styleType: 'primary' | 'secondary';
  fullWidth?: boolean;
}

type IndexScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Index'>;

const IndexScreen = () => {
  const navigation = useNavigation<IndexScreenNavigationProp>();
  const { settings } = useUserSettings();
  const insets = useSafeAreaInsets();
  // Determine if there's an active plan based on user settings
  // This logic might need adjustment based on how 'raceGoal' and 'fitnessLevel' are stored
  const hasActivePlan = Boolean(settings.raceGoal && settings.raceGoal.type && settings.fitnessLevel);

  // For now, we assume the user is always onboarded when reaching IndexScreen.
  // Onboarding flow would typically be handled before this screen is mounted,
  // e.g., by a conditional navigator in App.tsx.

  // Card Data
  const cardData: CardDataItem[] = [
    { id: 'StartRun', title: 'Start Run', icon: PlayCircle, description: 'Begin a new run', navigateTo: 'WorkoutTracker', styleType: 'primary', fullWidth: true },
    { id: 'RaceGoal', title: 'Race Goal', icon: Target, description: 'Set your target', navigateTo: 'RaceGoal', styleType: 'primary' },
    { id: 'Progress', title: 'Progress', icon: TrendingUp, description: 'Track your gains', navigateTo: 'Progress', styleType: 'primary' },
    { id: 'History', title: 'History', icon: Calendar, description: 'Past workouts', navigateTo: 'History', styleType: 'primary' },
    { id: 'LogActivity', title: 'Log Activity', icon: Plus, description: 'Manually add data', navigateTo: 'LogActivity', styleType: 'primary' },
    { id: 'Settings', title: 'Settings', icon: SettingsIcon, description: 'App preferences', navigateTo: 'Settings', styleType: 'secondary' },
  ];

  const renderCard = (item: typeof cardData[0]) => {
    const cardStyle = item.styleType === 'primary' ? styles.primaryCardBase : styles.secondaryCardBase;
    const iconStyle = item.styleType === 'primary' ? styles.primaryIconContainer : styles.secondaryIconContainer;
    const titleStyle = item.styleType === 'primary' ? styles.primaryTitleText : styles.secondaryTitleText;
    const descStyle = item.styleType === 'primary' ? styles.primaryDescriptionText : styles.secondaryDescriptionText;
    const IconComponent = item.icon;

    // Define the race goal badge content and color if applicable
    const showRaceGoalBadge = item.id === 'RaceGoal' && hasActivePlan && settings.raceGoal?.type;
    let raceGoalText = '';
    // Get the race-specific color
    const raceColor = showRaceGoalBadge && settings.raceGoal?.type ? getRaceColor(settings.raceGoal.type) : null;
    if (showRaceGoalBadge && settings.raceGoal?.type) {
      switch (settings.raceGoal.type) {
        case '5k': raceGoalText = '5K'; break;
        case '10k': raceGoalText = '10K'; break;
        case 'half-marathon': raceGoalText = 'Half'; break;
        case 'marathon': raceGoalText = 'Full'; break;
        default: raceGoalText = 'Race'; break;
      }
    }

    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.cardBase, cardStyle, item.fullWidth ? styles.fullWidthCardItem : styles.halfWidthCardItem]}
        onPress={() => {
          if (item.navigateTo) {
            switch (item.navigateTo) {
              case 'Index':
                navigation.navigate('Index');
                break;
              case 'NotFound':
                navigation.navigate('NotFound');
                break;
              case 'WorkoutTracker':
                // Assuming WorkoutTracker might take params, but for this card, it's likely undefined
                navigation.navigate('WorkoutTracker', { currentPlan: undefined }); 
                break;
              case 'Settings':
                navigation.navigate('Settings');
                break;
              case 'Progress':
                navigation.navigate('Progress');
                break;
              case 'History':
                navigation.navigate('History');
                break;
              case 'RaceGoal':
                navigation.navigate('RaceGoal');
                break;
              case 'LogActivity':
                navigation.navigate('LogActivity');
                break;
              // Add cases for any other routes defined in RootStackParamList that cards might navigate to
              default:
                // Optionally handle unknown routes, though navigateTo is typed as keyof RootStackParamList
                console.warn(`Unknown route: ${item.navigateTo}`);
                break;
            }
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainerBase, iconStyle]}>
          <IconComponent color={item.styleType === 'primary' ? "#FFFFFF" : "#3b82f6"} size={28} />
          {showRaceGoalBadge && (
            <View style={[styles.goalBadge, raceColor ? { backgroundColor: raceColor } : null]}>
              <Text style={styles.goalBadgeText}>{raceGoalText}</Text>
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.titleTextBase, titleStyle]}>{item.title}</Text>
          <Text style={[styles.descriptionTextBase, descStyle]}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <HeaderSafeArea />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
        <View style={[styles.logoContainer, { paddingVertical: 10 }]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Row 1: Start Run */}
        <View style={styles.rowContainer}>
          {renderCard(cardData.find(c => c.id === 'StartRun')!)}
        </View>

        {/* Row 2: Race Goal | Progress */}
        <View style={styles.rowContainer}>
          {renderCard(cardData.find(c => c.id === 'RaceGoal')!)}
          <View style={styles.cardSpacer} />
          {renderCard(cardData.find(c => c.id === 'Progress')!)}
        </View>

        {/* Row 3: History | Log Activity */}
        <View style={styles.rowContainer}>
          {renderCard(cardData.find(c => c.id === 'History')!)}
          <View style={styles.cardSpacer} />
          {renderCard(cardData.find(c => c.id === 'LogActivity')!)}
        </View>

        {/* Row 4: Settings | (empty) */}
        <View style={styles.rowContainer}>
          {renderCard(cardData.find(c => c.id === 'Settings')!)}
          <View style={styles.halfWidthCardItem} /> {/* Empty spacer */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#111827', // Dark background, similar to slate-900
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContentContainer: {
    paddingHorizontal: 16, // Add horizontal padding for rows
    paddingBottom: 20,
    alignItems: 'center', // Still useful for logo
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'transparent', // Changed to transparent from blueish color
    marginBottom: 10,
  },
  logo: {
    width: 180,
    height: 70,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  fullWidthCardItem: {
    width: '100%',
  },
  halfWidthCardItem: {
    width: '48%', // Allows for a small gap with justifyContent: 'space-between'
  },
  cardSpacer: {
    width: '4%', // Spacer for between half-width cards
  },
  cardBase: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryCardBase: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryCardBase: {
    backgroundColor: 'rgba(75, 85, 99, 0.2)', // gray-600/20
    borderColor: 'rgba(107, 114, 128, 0.3)', // gray-500/30
  },
  iconContainerBase: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500/80
  },
  secondaryIconContainer: {
    backgroundColor: 'rgba(107, 114, 128, 0.5)', // gray-500/50
  },
  textContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  goalBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleTextBase: {
    fontSize: 17, // Unified title size
    fontWeight: '600',
    marginBottom: 4,
  },
  primaryTitleText: {
    color: '#FFFFFF',
  },
  secondaryTitleText: {
    color: '#E5E7EB', // Light gray for secondary titles
  },
  descriptionTextBase: {
    fontSize: 13, // Unified description size
    textAlign: 'center',
  },
  primaryDescriptionText: {
    color: '#d1d5db', // gray-300
  },
  secondaryDescriptionText: {
    color: '#9CA3AF', // gray-400
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

