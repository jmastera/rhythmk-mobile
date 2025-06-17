import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Plus, PlayCircle, Target, TrendingUp, Calendar, Map, Navigation } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useUserSettings } from '../hooks/useUserSettings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRaceColor } from '../utils/raceColors';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { useTheme, Theme } from '../theme/ThemeProvider';

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

type IndexScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Index'> & {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
};

const IndexScreen = () => {
  const navigation = useNavigation<IndexScreenNavigationProp>();
  const { settings, refreshSettings } = useUserSettings();
  const insets = useSafeAreaInsets();
  const theme = useTheme() as Theme;
  
  // State to force re-render when race goal is updated
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Refresh settings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshSettings();
      setForceUpdate(prev => prev + 1);
      return () => {}; // cleanup function
    }, [refreshSettings])
  );

  // Determine if there's an active plan based on user settings
  const hasActivePlan = Boolean(settings.raceGoal?.type && settings.fitnessLevel);

  // Card data array with navigation handlers
  const cardData: CardDataItem[] = [
    { 
      id: 'StartRun', 
      title: 'Start Run', 
      icon: PlayCircle, 
      description: 'Begin a new run', 
      navigateTo: 'StartRun', 
      styleType: 'primary', 
      fullWidth: true 
    },
    { 
      id: 'SavedRoutes', 
      title: 'Routes', 
      icon: Navigation, 
      description: 'Manage your routes', 
      navigateTo: 'Routes', 
      styleType: 'primary' 
    },
    { 
      id: 'RaceGoal', 
      title: 'Race Goal', 
      icon: Target, 
      description: 'Set your target', 
      navigateTo: 'RaceGoal', 
      styleType: 'primary' 
    },
    { 
      id: 'Progress', 
      title: 'Progress', 
      icon: TrendingUp, 
      description: 'Track your gains', 
      navigateTo: 'Progress', 
      styleType: 'primary' 
    },
    { 
      id: 'History', 
      title: 'History', 
      icon: Calendar, 
      description: 'Past workouts', 
      navigateTo: 'HistoryList', 
      styleType: 'primary' 
    },
    { 
      id: 'LogActivity', 
      title: 'Log Activity', 
      icon: Plus, 
      description: 'Manually log a workout', 
      navigateTo: 'LogActivity', 
      styleType: 'primary' 
    },
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
        case 'hyrox': raceGoalText = 'Hyrox'; break;
        default: raceGoalText = 'Race'; break;
      }
    }

    const handlePress = () => {
      if (!item.navigateTo) return;
      
      // Special handling for modal screens
      if (item.navigateTo === 'RaceGoal') {
        // Just navigate to RaceGoal without the ID since it's not part of the type
        navigation.navigate('RaceGoal');
      } else if (item.navigateTo === 'LogActivity') {
        navigation.navigate('LogActivity');
      } else {
        // For tab navigation, we can use navigate to switch tabs
        navigation.navigate(item.navigateTo as any);
      }
    };

    return (
      <TouchableOpacity 
        key={item.id}
        style={[
          styles.cardBase, 
          cardStyle, 
          item.fullWidth ? styles.fullWidthCardItem : styles.halfWidthCardItem,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, iconStyle]}>
          <IconComponent 
            size={24} 
            color={item.styleType === 'primary' ? '#FFFFFF' : theme.colors.primary} 
          />
          {showRaceGoalBadge && raceColor && (
            <View style={[styles.raceBadge, { backgroundColor: raceColor }]}>
              <Text style={styles.raceBadgeText}>{raceGoalText}</Text>
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.titleText, titleStyle, { color: theme.colors.text.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.descriptionText, descStyle, { color: theme.colors.text.secondary }]}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.scrollView, { backgroundColor: theme.colors.background, flex: 1 }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <HeaderSafeArea />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        
        <View style={[styles.rowContainer, styles.cardRow]}>
          {cardData.filter(card => card.id === 'StartRun').map((item) => renderCard(item))}
        </View>

        <View style={[styles.rowContainer, styles.cardRow]}>
          {cardData
            .filter(card => ['SavedRoutes', 'History'].includes(card.id))
            .map((item) => (
              <React.Fragment key={item.id}>
                {renderCard(item)}
                {item.id === 'SavedRoutes' && <View style={styles.cardSpacer} />}
              </React.Fragment>
            ))}
        </View>

        <View style={[styles.rowContainer, styles.cardRow, { marginBottom: 0 }]}>
          {cardData
            .filter(card => ['RaceGoal', 'Progress', 'LogActivity'].includes(card.id))
            .map((item, index, array) => (
              <React.Fragment key={item.id}>
                {renderCard(item)}
                {index < array.length - 1 && <View style={styles.cardSpacer} />}
              </React.Fragment>
            ))}
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
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
    width: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#F9FAFB', // Light text color
  },
  subtitleText: {
    fontSize: 16,
    color: '#9CA3AF', // Gray-400 for subtitle
    marginBottom: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 0, // Remove bottom margin from container
  },
  cardRow: {
    // No additional margins needed here
  },
  cardSpacer: {
    width: '4%', // Space between cards
  },
  cardBase: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryCardBase: {
    // Transparent background with subtle border for primary cards
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
  },
  secondaryCardBase: {
    // Slightly different transparency for secondary cards
    backgroundColor: 'rgba(31, 41, 55, 0.2)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Slightly transparent blue
  },
  primaryIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Semi-transparent blue
  },
  secondaryIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // More transparent for secondary
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  primaryTitleText: {
    color: '#F9FAFB', // White text for primary cards
  },
  secondaryTitleText: {
    color: '#E5E7EB', // Light gray for secondary titles
  },
  descriptionText: {
    fontSize: 14,
    color: '#E5E7EB', // Lighter gray for better visibility on dark
    textAlign: 'center',
  },
  primaryDescriptionText: {
    color: '#9CA3AF', // Lighter text for primary cards
  },
  secondaryDescriptionText: {
    color: '#9CA3AF',
  },
  raceBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981', // Emerald-500
    borderRadius: 12,
    minWidth: 40,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fullWidthCardItem: {
    width: '100%',
    // No fixed height to allow natural content height
    marginBottom: 12, // 12px spacing after full-width card
  },
  halfWidthCardItem: {
    width: '48%',
    aspectRatio: 1, // Make cards square
    justifyContent: 'center', // Center content vertically
    marginBottom: 12, // 12px spacing after half-width cards
  },

});

export default IndexScreen;
