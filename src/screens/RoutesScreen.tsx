import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { ChevronLeft } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Route } from '../types/routeTypes';
import { useRoutes } from '../contexts/RouteContext';
import { formatDistanceDisplay, formatDurationDisplay } from '../utils/PaceCalculator';
import { RootStackParamList } from '../navigation/types';

type RoutesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Routes'>;

const RoutesScreen = () => {
  const navigation = useNavigation<RoutesScreenNavigationProp>();
  const { getRoutes, deleteRoute } = useRoutes();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Get theme colors
  const { colors } = useTheme();
  
  // Create dynamic styles that depend on theme
  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.text.primary,
    },
    container: {
      backgroundColor: colors.background,
    },
    routeItem: {
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
    },
    routeName: {
      color: colors.text.primary,
    },
    routeDetail: {
      color: colors.text.secondary,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    deleteButtonText: {
      color: colors.text.inverse,
    },
    emptyContainer: {
      backgroundColor: colors.background,
    },
    emptyText: {
      color: colors.text.primary,
    },
    emptySubtext: {
      color: colors.text.secondary,
    },
  });

  const loadRoutes = useCallback(async () => {
    try {
      const savedRoutes = await getRoutes();
      setRoutes(savedRoutes);
    } catch (error) {
      console.error('Failed to load routes:', error);
      Alert.alert('Error', 'Failed to load saved routes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getRoutes]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRoutes);
    return unsubscribe;
  }, [navigation, loadRoutes]);

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await deleteRoute(routeId);
      setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
    } catch (error) {
      console.error('Failed to delete route:', error);
      Alert.alert('Error', 'Failed to delete route');
    }
  };

  const confirmDelete = (routeId: string, routeName: string) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${routeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteRoute(routeId) },
      ]
    );
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity 
      style={[styles.routeItem, dynamicStyles.routeItem]}
      onPress={() => navigation.navigate('RouteDetails', { routeId: item.id })}
    >
      <View style={styles.routeInfo}>
        <Text style={[styles.routeName, dynamicStyles.routeName]}>{item.name}</Text>
        <View style={styles.routeDetails}>
          <Text style={[styles.routeDetail, dynamicStyles.routeDetail]}>
            {formatDistanceDisplay(item.distance)}
          </Text>
          <Text style={[styles.routeDetail, dynamicStyles.routeDetail]}>
            {formatDurationDisplay(item.duration || 0)}
          </Text>
          {item.averagePace && (
            <Text style={[styles.routeDetail, dynamicStyles.routeDetail]}>
              {formatDistanceDisplay(1000 / item.averagePace * 60, 'km')}/km
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => confirmDelete(item.id, item.name)}
        style={[styles.deleteButton, dynamicStyles.deleteButton]}
      >
        <Text style={[styles.deleteButtonText, dynamicStyles.deleteButtonText]}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.safeArea, dynamicStyles.safeArea]}>
      <HeaderSafeArea />
      <View style={styles.headerTextContainer}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Saved Routes</Text>
      </View>
      
      <View style={[styles.container, dynamicStyles.container]}>
        <FlatList
          data={routes}
          renderItem={renderRouteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, dynamicStyles.emptyContainer]}>
              <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
                No saved routes yet
              </Text>
              <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>
                Complete a workout to save your first route
              </Text>
            </View>
          }
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadRoutes();
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  routeDetail: {
    marginRight: 16,
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },

});

export default RoutesScreen;
