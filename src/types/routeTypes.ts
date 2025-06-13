// src/types/routeTypes.ts

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  timestamp?: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
}

export interface RoutePoint extends Omit<Coordinate, 'altitude' | 'accuracy' | 'speed' | 'heading'> {
  elevation?: number;
  name?: string;
}

export interface RouteTurn {
  type: 'turn' | 'arrive' | 'continue' | 'depart';
  direction?: 'left' | 'right' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right';
  modifier?: string;
  bearing_before: number;
  bearing_after: number;
  location: [number, number];
  distance: number;
  duration: number;
  name?: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  waypoints: RoutePoint[];
  turns?: RouteTurn[];
  distance: number; // in meters
  elevationGain?: number; // in meters
  duration?: number; // in seconds
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  isFavorite?: boolean;
  averagePace?: number; // in seconds per km
  maxSpeed?: number; // in m/s
  caloriesBurned?: number;
  tags?: string[];
  isPublic?: boolean;
  userId?: string;
  // For backward compatibility with old schema
  elevation_gain?: number;
  created_at?: string;
  updated_at?: string;
}

export type NewRoute = Omit<Route, 'id' | 'createdAt' | 'updatedAt' | 'created_at' | 'updated_at'> & {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type RouteFilter = {
  minDistance?: number;
  maxDistance?: number;
  startDate?: Date;
  endDate?: Date;
  isFavorite?: boolean;
  searchQuery?: string;
}