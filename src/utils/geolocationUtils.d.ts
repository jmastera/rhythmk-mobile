// Type definitions for geolocationUtils

export declare function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number;

export declare function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number;

export declare function getClosestPointOnSegment(
  point: { latitude: number; longitude: number },
  lineStart: { latitude: number; longitude: number },
  lineEnd: { latitude: number; longitude: number }
): { latitude: number; longitude: number; distance: number };

export declare function distanceToRoute(
  point: { latitude: number; longitude: number },
  routePoints: Array<{ latitude: number; longitude: number }>
): { distance: number; closestPoint: { latitude: number; longitude: number } };

export declare function calculateRouteProgress(
  point: { latitude: number; longitude: number },
  routePoints: Array<{ latitude: number; longitude: number }>
): { progress: number; distanceRemaining: number };
