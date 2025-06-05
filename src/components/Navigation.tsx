import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Target, BarChart3, Calendar, Play, Plus, Settings as SettingsIcon, ArrowLeft, LucideIcon } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // Adjust path as necessary




interface NavItem {
  id: keyof RootStackParamList;
  title: string;
  icon: LucideIcon;
  description: string;
  isPrimary: boolean;
  badge?: string;
}

interface NavigationProps {
  hasActivePlan: boolean;
  isSelectingRace?: boolean;
  onCancelRaceSelection?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  hasActivePlan,
  isSelectingRace = false,
  onCancelRaceSelection = () => {},
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const navItems: NavItem[] = [
    {
      id: 'WorkoutTracker',
      title: 'Start Run',
      icon: Play,
      description: 'Track your workout',
      isPrimary: true,
    },
    {
      id: 'Progress',
      title: 'Progress',
      icon: BarChart3,
      description: 'Monitor your stats',
      isPrimary: true,
    },
    {
      id: 'History',
      title: 'History',
      icon: Calendar,
      description: 'Past workouts',
      isPrimary: true,
    },
    {
      id: 'RaceGoal',
      title: 'Race Goal',
      icon: Target, // Default icon, will be dynamically changed
      badge: hasActivePlan ? 'Active' : 'Optional',
      description: hasActivePlan ? 'Your training plan' : 'Set a race target',
      isPrimary: false,
      
    },
    {
      id: 'Settings',
      title: 'Settings',
      icon: SettingsIcon,
      description: 'App preferences',
      isPrimary: false,
    },
  ];

  return (
    <View style={styles.gridContainer}>
      {navItems.map((item) => {
        let displayTitle: string = item.title;
        let DisplayIconComponent = item.icon;

        if (item.id === 'RaceGoal' && isSelectingRace) {
          DisplayIconComponent = ArrowLeft;
        } else if (item.id === 'RaceGoal') {
          DisplayIconComponent = hasActivePlan ? Target : Plus;
        } else {
          DisplayIconComponent = item.icon;
        }
        let displayDescription: string = item.description;
        let displayOnClick;
        if (item.id === 'RaceGoal' && isSelectingRace) {
          displayOnClick = onCancelRaceSelection;
        } else {
          // Use a switch for type-safe navigation
          switch (item.id) {
            case 'WorkoutTracker':
              displayOnClick = () => navigation.navigate('WorkoutTracker', {});
              break;
            case 'Progress':
              displayOnClick = () => navigation.navigate('Progress', undefined);
              break;
            case 'History':
              displayOnClick = () => navigation.navigate('History', undefined);
              break;
            case 'RaceGoal':
              displayOnClick = () => navigation.navigate('RaceGoal', undefined);
              break;
            case 'Settings':
              displayOnClick = () => navigation.navigate('Settings', undefined);
              break;
            default:
              // This case should ideally not be reached if navItems are correctly defined
              // and cover all navigable items from this component.
              // Perform an exhaustive check to ensure all cases are handled if item.id was a stricter union.
              // const _exhaustiveCheck: never = item.id;
              displayOnClick = () => console.warn('Unhandled navigation item:', item.id);
              break;
          }
        }
        let displayBadge = item.badge;
        let displayIsPrimary = item.isPrimary;

        if (item.id === 'RaceGoal' && isSelectingRace) {
          displayTitle = 'Cancel';
          // Icon is handled by the logic above for DisplayIconComponent
          displayDescription = 'Go back to options';
          displayOnClick = onCancelRaceSelection;
          displayBadge = undefined;
          displayIsPrimary = false; // Style as a secondary/action button
        }

        const isActive = (route.name === item.id) && !(item.id === 'RaceGoal' && isSelectingRace);

        const cardStyle = [
          styles.card,
          isActive
            ? styles.activeCard
            : displayIsPrimary
            ? styles.primaryCard
            : styles.secondaryCard,
        ];

        const iconOuterCircleStyle = [
          styles.iconOuterCircle,
          isActive
            ? styles.activeIconOuterCircle
            : displayIsPrimary
            ? styles.primaryIconOuterCircle
            : styles.secondaryIconOuterCircle,
        ];
        
        const iconColor = isActive
          ? 'white'
          : displayIsPrimary
          ? '#d1d5db' // gray-300
          : '#9ca3af'; // gray-400

        const titleColor = isActive
          ? '#f97316' // orange-400 (using orange-500 for more pop)
          : displayIsPrimary
          ? 'white'
          : '#d1d5db'; // gray-300

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItemContainer}
            onPress={displayOnClick}
            activeOpacity={0.7}
          >
            <View style={cardStyle}>
              <View style={iconOuterCircleStyle}>
                <DisplayIconComponent color={iconColor} size={24} />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleBadgeRow}>
                  <Text style={[styles.titleText, { color: titleColor }]}>{displayTitle}</Text>
                  {displayBadge && !isSelectingRace && (
                    <View
                      style={[
                        styles.badgeContainer,
                        displayBadge === 'Active'
                          ? styles.activeBadgeContainer
                          : styles.optionalBadgeContainer,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          displayBadge === 'Active'
                            ? styles.activeBadgeText
                            : styles.optionalBadgeText,
                        ]}
                      >
                        {displayBadge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.descriptionText,
                    displayIsPrimary ? styles.primaryDescriptionText : styles.secondaryDescriptionText,
                  ]}
                >
                  {displayDescription}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8, // Give some space on the sides
  },
  navItemContainer: {
    width: '48%', // Creates two columns with a small gap in between
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeCard: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)', // orange-500/20
    borderColor: 'rgba(249, 115, 22, 0.5)', // orange-500/50
  },
  primaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // white/10
    borderColor: 'rgba(255, 255, 255, 0.2)', // white/20
  },
  secondaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // white/5
    borderColor: 'rgba(255, 255, 255, 0.1)', // white/10
  },
  iconOuterCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeIconOuterCircle: {
    backgroundColor: '#f97316', // orange-500
  },
  primaryIconOuterCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // white/20
  },
  secondaryIconOuterCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // white/10
  },
  textContainer: {
    alignItems: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  activeBadgeContainer: {
    backgroundColor: '#f97316', // orange-500 (like default web badge)
  },
  optionalBadgeContainer: {
    borderColor: '#6b7280', // gray-500
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeBadgeText: {
    color: 'white',
  },
  optionalBadgeText: {
    color: '#9ca3af', // gray-400
  },
  descriptionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  primaryDescriptionText: {
    color: '#9ca3af', // gray-400
  },
  secondaryDescriptionText: {
    color: '#6b7280', // gray-500
  },
});

export default Navigation;
