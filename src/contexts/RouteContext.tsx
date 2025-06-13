// src/contexts/RouteContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Route, NewRoute, RouteFilter } from '../types/routeTypes';
import routeDatabase from '../services/RouteDatabase';

export interface RouteContextType {
  routes: Route[];
  isLoading: boolean;
  error: Error | null;
  saveRoute: (route: NewRoute) => Promise<Route>;
  updateRoute: (id: string, updates: Partial<NewRoute>) => Promise<Route | null>;
  deleteRoute: (id: string) => Promise<boolean>;
  getRouteById: (id: string) => Promise<Route | null>;
  getRoutes: (filter?: RouteFilter) => Promise<Route[]>;
  refreshRoutes: (filter?: RouteFilter) => Promise<void>;
  currentFilter: RouteFilter;
  setFilter: (filter: RouteFilter) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilter, setCurrentFilter] = useState<RouteFilter>({});

  const initializeDatabase = useCallback(async () => {
    try {
      await routeDatabase.init();
      await refreshRoutes();
    } catch (err) {
      console.error('Failed to initialize route database:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize database'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeDatabase();

    // Cleanup on unmount
    return () => {
      routeDatabase.close().catch(console.error);
    };
  }, [initializeDatabase]);

  const getRoutes = useCallback(async (filter: RouteFilter = {}): Promise<Route[]> => {
    try {
      const allRoutes = await routeDatabase.getRoutes();
      
      // Apply filters
      return allRoutes.filter(route => {
        if (filter.minDistance !== undefined && route.distance < filter.minDistance) return false;
        if (filter.maxDistance !== undefined && route.distance > filter.maxDistance) return false;
        if (filter.startDate !== undefined && route.createdAt < filter.startDate.getTime()) return false;
        if (filter.endDate !== undefined && route.createdAt > filter.endDate.getTime()) return false;
        if (filter.isFavorite !== undefined && route.isFavorite !== filter.isFavorite) return false;
        
        if (filter.searchQuery) {
          const searchLower = filter.searchQuery.toLowerCase();
          return (
            route.name.toLowerCase().includes(searchLower) ||
            (route.description && route.description.toLowerCase().includes(searchLower)) ||
            false
          );
        }
        
        return true;
      });
    } catch (err) {
      console.error('Failed to get routes:', err);
      throw err;
    }
  }, []);

  const refreshRoutes = useCallback(async (filter: RouteFilter = {}) => {
    try {
      setIsLoading(true);
      const newFilter = { ...currentFilter, ...filter };
      setCurrentFilter(newFilter);
      const filteredRoutes = await getRoutes(filter);
      setRoutes(filteredRoutes);
      setError(null);
    } catch (err) {
      console.error('Error refreshing routes:', err);
      setError(err instanceof Error ? err : new Error('Failed to load routes'));
    } finally {
      setIsLoading(false);
    }
  }, [currentFilter]);

  const saveRoute = useCallback(async (route: NewRoute): Promise<Route> => {
    try {
      setIsLoading(true);
      const savedRoute = await routeDatabase.saveRoute(route);
      await refreshRoutes();
      return savedRoute;
    } catch (err) {
      console.error('Error saving route:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshRoutes]);

  const updateRoute = useCallback(async (id: string, updates: Partial<NewRoute>): Promise<Route | null> => {
    try {
      setIsLoading(true);
      const updatedRoute = await routeDatabase.updateRoute(id, updates);
      await refreshRoutes();
      return updatedRoute;
    } catch (err) {
      console.error('Error updating route:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshRoutes]);

  const deleteRoute = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await routeDatabase.deleteRoute(id);
      await refreshRoutes();
      return success;
    } catch (err) {
      console.error('Error deleting route:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshRoutes]);

  const getRouteById = useCallback(async (id: string): Promise<Route | null> => {
    try {
      return await routeDatabase.getRouteById(id);
    } catch (err) {
      console.error('Error getting route by ID:', err);
      throw err;
    }
  }, []);

  const setFilter = useCallback((filter: RouteFilter) => {
    refreshRoutes(filter);
  }, [refreshRoutes]);

  return (
    <RouteContext.Provider
      value={{
        routes,
        isLoading,
        error,
        saveRoute,
        updateRoute,
        deleteRoute,
        getRouteById,
        getRoutes,
        refreshRoutes,
        currentFilter,
        setFilter: setCurrentFilter,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = (): RouteContextType => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoutes must be used within a RouteProvider');
  }
  return context;
};