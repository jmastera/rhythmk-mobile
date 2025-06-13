// src/services/RouteDatabase.ts

import * as SQLite from 'expo-sqlite';
import { Coordinate, Route, NewRoute, RouteFilter } from '../types/routeTypes';

const DB_NAME = 'rhythmk_routes.db';

class RouteDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.setupDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async setupDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Create routes table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        distance REAL NOT NULL,
        elevation_gain REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_favorite INTEGER DEFAULT 0,
        average_pace REAL,
        max_speed REAL,
        duration INTEGER,
        calories_burned REAL,
        tags TEXT,
        is_public INTEGER DEFAULT 0,
        user_id TEXT
      );
    `);

    // Create waypoints table with foreign key to routes
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS route_waypoints (
        id TEXT PRIMARY KEY NOT NULL,
        route_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL,
        timestamp INTEGER,
        accuracy REAL,
        speed REAL,
        heading REAL,
        waypoint_index INTEGER NOT NULL,
        FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better query performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_id 
      ON route_waypoints (route_id);
    `);
  }

  // Add methods for CRUD operations
  async saveRoute(route: NewRoute): Promise<Route> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = Date.now();
    const routeId = route.id || `route_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const waypoints = route.waypoints || [];
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO routes (
        id, name, description, distance, elevation_gain, 
        created_at, updated_at, is_favorite, average_pace, 
        max_speed, duration, calories_burned, tags, is_public, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        routeId,
        route.name,
        route.description || null,
        route.distance,
        route.elevationGain || 0,
        route.createdAt || now,
        now, // Always update the updated_at timestamp
        route.isFavorite ? 1 : 0,
        route.averagePace || null,
        route.maxSpeed || null,
        route.duration || null,
        route.caloriesBurned || null,
        route.tags ? JSON.stringify(route.tags) : null,
        route.isPublic ? 1 : 0,
        route.userId || null,
      ]
    );

    // Save waypoints
    await this.saveWaypoints(routeId, waypoints);

    return {
      ...route,
      id: routeId,
      createdAt: route.createdAt || now,
      updatedAt: now,
      waypoints,
    };
  }

  private async saveWaypoints(routeId: string, waypoints: Coordinate[]): Promise<void> {
    if (!this.db || !waypoints.length) return;

    // Delete existing waypoints for this route
    await this.db.runAsync('DELETE FROM route_waypoints WHERE route_id = ?', [routeId]);

    // Insert new waypoints
    const values = waypoints.map((wp, index) => [
      `wp_${routeId}_${index}`,
      routeId,
      wp.latitude,
      wp.longitude,
      wp.altitude || null,
      wp.timestamp || null,
      wp.accuracy || null,
      wp.speed || null,
      wp.heading || null,
      index,
    ]);

    const placeholders = waypoints.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const flatValues = ([] as any[]).concat(...values);

    await this.db.runAsync(
      `INSERT INTO route_waypoints (
        id, route_id, latitude, longitude, altitude, 
        timestamp, accuracy, speed, heading, waypoint_index
      ) VALUES ${placeholders}`,
      flatValues
    );
  }

  async getRouteById(id: string): Promise<Route | null> {
    if (!this.db) throw new Error('Database not initialized');

    const route = await this.db.getFirstAsync<{
      id: string;
      name: string;
      description: string | null;
      distance: number;
      elevation_gain: number;
      created_at: number;
      updated_at: number;
      is_favorite: number;
      average_pace: number | null;
      max_speed: number | null;
      duration: number | null;
      calories_burned: number | null;
      tags: string | null;
      is_public: number;
      user_id: string | null;
    }>('SELECT * FROM routes WHERE id = ?', [id]);

    if (!route) return null;

    const waypoints = await this.getWaypointsForRoute(id);

    return {
      id: route.id,
      name: route.name,
      description: route.description || undefined,
      waypoints,
      distance: route.distance,
      elevationGain: route.elevation_gain,
      createdAt: route.created_at,
      updatedAt: route.updated_at,
      isFavorite: route.is_favorite === 1,
      averagePace: route.average_pace || undefined,
      maxSpeed: route.max_speed || undefined,
      duration: route.duration || undefined,
      caloriesBurned: route.calories_burned || undefined,
      tags: route.tags ? JSON.parse(route.tags) : undefined,
      isPublic: route.is_public === 1,
      userId: route.user_id || undefined,
    };
  }

  private async getWaypointsForRoute(routeId: string): Promise<Coordinate[]> {
    if (!this.db) return [];

    const waypoints = await this.db.getAllAsync<{
      latitude: number;
      longitude: number;
      altitude: number | null;
      timestamp: number | null;
      accuracy: number | null;
      speed: number | null;
      heading: number | null;
    }>(
      `SELECT latitude, longitude, altitude, timestamp, accuracy, speed, heading 
       FROM route_waypoints 
       WHERE route_id = ? 
       ORDER BY waypoint_index ASC`,
      [routeId]
    );

    return waypoints.map(wp => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
      ...(wp.altitude !== null && { altitude: wp.altitude }),
      ...(wp.timestamp !== null && { timestamp: wp.timestamp }),
      ...(wp.accuracy !== null && { accuracy: wp.accuracy }),
      ...(wp.speed !== null && { speed: wp.speed }),
      ...(wp.heading !== null && { heading: wp.heading }),
    }));
  }

  async getAllRoutes(filter: RouteFilter = {}): Promise<Route[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT id FROM routes WHERE 1=1';
    const params: any[] = [];

    // Apply filters
    if (filter.minDistance !== undefined) {
      query += ' AND distance >= ?';
      params.push(filter.minDistance);
    }
    if (filter.maxDistance !== undefined) {
      query += ' AND distance <= ?';
      params.push(filter.maxDistance);
    }
    if (filter.startDate) {
      query += ' AND created_at >= ?';
      params.push(filter.startDate.getTime());
    }
    if (filter.endDate) {
      query += ' AND created_at <= ?';
      params.push(filter.endDate.getTime());
    }
    if (filter.isFavorite !== undefined) {
      query += ' AND is_favorite = ?';
      params.push(filter.isFavorite ? 1 : 0);
    }
    if (filter.searchQuery) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filter.searchQuery}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const routeIds = await this.db.getAllAsync<{ id: string }>(query, params);
    const routes: Route[] = [];

    for (const { id } of routeIds) {
      const route = await this.getRouteById(id);
      if (route) routes.push(route);
    }

    return routes;
  }

  async updateRoute(id: string, updates: Partial<NewRoute>): Promise<Route | null> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.getRouteById(id);
    if (!existing) return null;

    const updatedRoute: Route = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    // If waypoints are being updated, save them
    if (updates.waypoints) {
      await this.saveWaypoints(id, updates.waypoints);
    }

    // Update the route metadata
    await this.db.runAsync(
      `UPDATE routes SET 
        name = ?, 
        description = ?, 
        distance = ?, 
        elevation_gain = ?, 
        updated_at = ?, 
        is_favorite = ?,
        average_pace = ?,
        max_speed = ?,
        duration = ?,
        calories_burned = ?,
        tags = ?,
        is_public = ?,
        user_id = ?
      WHERE id = ?`,
      [
        updatedRoute.name,
        updatedRoute.description || null,
        updatedRoute.distance,
        updatedRoute.elevationGain !== undefined ? updatedRoute.elevationGain : null,
        updatedRoute.updatedAt,
        updatedRoute.isFavorite ? 1 : 0,
        updatedRoute.averagePace || null,
        updatedRoute.maxSpeed || null,
        updatedRoute.duration || null,
        updatedRoute.caloriesBurned || null,
        updatedRoute.tags ? JSON.stringify(updatedRoute.tags) : null,
        updatedRoute.isPublic ? 1 : 0,
        updatedRoute.userId || null,
        id,
      ]
    );

    return this.getRouteById(id);
  }

  async deleteRoute(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    // The CASCADE foreign key constraint will automatically delete related waypoints
    const result = await this.db.runAsync('DELETE FROM routes WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  async getRoutes(): Promise<Route[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // First, get all routes
      const routes = await this.db.getAllAsync<{
        id: string;
        name: string;
        description: string | null;
        distance: number;
        elevation_gain: number;
        created_at: number;
        updated_at: number;
        is_favorite: number;
        average_pace: number | null;
        max_speed: number | null;
        duration: number | null;
        calories_burned: number | null;
        tags: string | null;
        is_public: number;
        user_id: string | null;
      }>('SELECT * FROM routes ORDER BY created_at DESC');
      
      if (!routes || routes.length === 0) {
        return [];
      }
      
      // Get waypoints for all routes in a single query
      const routeIds = routes.map(r => `'${r.id}'`).join(',');
      const waypointsResult = await this.db.getAllAsync<{
        id: string;
        route_id: string;
        latitude: number;
        longitude: number;
        altitude: number | null;
        timestamp: number | null;
        accuracy: number | null;
        speed: number | null;
        heading: number | null;
      }>(
        `SELECT * FROM route_waypoints WHERE route_id IN (${routeIds}) ORDER BY timestamp ASC`
      );
      
      // Group waypoints by route_id
      const waypointsByRouteId = waypointsResult.reduce<Record<string, any[]>>((acc, waypoint) => {
        if (!acc[waypoint.route_id]) {
          acc[waypoint.route_id] = [];
        }
        acc[waypoint.route_id].push({
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
          altitude: waypoint.altitude,
          timestamp: waypoint.timestamp,
          accuracy: waypoint.accuracy,
          speed: waypoint.speed,
          heading: waypoint.heading,
        });
        return acc;
      }, {});
      
      // Combine routes with their waypoints
      return routes.map(route => ({
        id: route.id,
        name: route.name,
        description: route.description || undefined,
        waypoints: waypointsByRouteId[route.id] || [],
        distance: route.distance,
        elevationGain: route.elevation_gain,
        createdAt: route.created_at,
        updatedAt: route.updated_at,
        isFavorite: Boolean(route.is_favorite),
        averagePace: route.average_pace || undefined,
        maxSpeed: route.max_speed || undefined,
        duration: route.duration || undefined,
        caloriesBurned: route.calories_burned || undefined,
        tags: route.tags ? JSON.parse(route.tags) : [],
        isPublic: Boolean(route.is_public),
        userId: route.user_id || undefined,
      }));
    } catch (error) {
      console.error('Error getting routes:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const routeDatabase = new RouteDatabase();
export default routeDatabase;