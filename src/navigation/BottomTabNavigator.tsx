import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { View, Animated, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Home, PlayCircle, TrendingUp, Navigation, Settings as Gear, Calendar, Target, BookOpen } from 'lucide-react-native';

// Import stack navigators
import { HomeStack } from './HomeStack';
import { ProgressStack } from './ProgressStack';
import { RoutesStack } from './RoutesStack';
import { SettingsStack } from './SettingsStack';
import { StartRunStack } from './StartRunStack';
import { HistoryStack } from './HistoryStack';
import { RaceGoalStack } from './RaceGoalStack';
import { TrainingPlanStack } from './TrainingPlanStack';

// Import types
import { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;
const ACTIVE_ICON_SIZE = 30;
const INACTIVE_ICON_SIZE = 24;

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const theme = useTheme();
  const tabWidth = width / state.routes.length;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const toValue = state.index * tabWidth + tabWidth / 2 - 20;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 10,
      tension: 70,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.colors.background }]}>
      {/* Background with curve */}
      <Animated.View
        style={[
          styles.activeTabIndicator,
          {
            backgroundColor: theme.colors.background,
            transform: [
              { translateX: Animated.subtract(translateX, 30) },
            ],
          },
        ]}
      >
        <View style={[styles.curve, { backgroundColor: theme.colors.background }]} />
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const IconComponent = options.tabBarIcon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconSize = isFocused ? ACTIVE_ICON_SIZE : INACTIVE_ICON_SIZE;
          const iconColor = isFocused ? theme.colors.primary : theme.colors.text.primary;

          return (
            <TouchableWithoutFeedback
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tab}
            >
              <View style={styles.tab}>
                <IconComponent 
                  size={iconSize} 
                  color={iconColor} 
                />
                {isFocused && (
                  <View 
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: theme.colors.primary }
                    ]} 
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>
    </View>
  );
};

// Tab bar icon component (used for default configuration)
const TabBarIcon = ({ 
  color, 
  icon: IconComponent,
  focused 
}: { 
  color: string;
  icon: React.ElementType;
  focused?: boolean;
}) => {
  const size = focused ? ACTIVE_ICON_SIZE : INACTIVE_ICON_SIZE;
  
  return (
    <View style={styles.iconContainer}>
      <IconComponent size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'relative',
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTabIndicator: {
    position: 'absolute',
    width: 70,
    height: 70,
    backgroundColor: '#f0f0f0',
    borderRadius: 35,
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -35 }],
    zIndex: -1,
  },
  curve: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: 'white',
  },
  activeIndicator: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    bottom: 12,
    backgroundColor: '#007AFF',
  },
});

export const BottomTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={Home} />
          ),
        }} 
      />
      <Tab.Screen 
        name="StartRun" 
        component={StartRunStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={PlayCircle} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Routes" 
        component={RoutesStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={Navigation} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={TrendingUp} />
          ),
        }} 
      />
      <Tab.Screen 
        name="RaceGoal" 
        component={RaceGoalStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={Target} />
          ),
          title: 'Race Goal',
        }} 
      />
      <Tab.Screen 
        name="TrainingPlan" 
        component={TrainingPlanStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={BookOpen} />
          ),
          title: 'Training',
        }} 
      />
      <Tab.Screen 
        name="History" 
        component={HistoryStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={Calendar} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack} 
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} icon={Gear} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
