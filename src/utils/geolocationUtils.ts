// Calculate distance between two coordinates in meters using Haversine formula
export const haversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Calculate bearing between two coordinates in degrees
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
};

// Calculate the closest point on a line segment to a given point
export const getClosestPointOnSegment = (
  point: { latitude: number; longitude: number },
  lineStart: { latitude: number; longitude: number },
  lineEnd: { latitude: number; longitude: number }
): { latitude: number; longitude: number; distance: number } => {
  const A = point.longitude - lineStart.longitude;
  const B = point.latitude - lineStart.latitude;
  const C = lineEnd.longitude - lineStart.longitude;
  const D = lineEnd.latitude - lineStart.latitude;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.longitude;
    yy = lineStart.latitude;
  } else if (param > 1) {
    xx = lineEnd.longitude;
    yy = lineEnd.latitude;
  } else {
    xx = lineStart.longitude + param * C;
    yy = lineStart.latitude + param * D;
  }

  const dx = point.longitude - xx;
  const dy = point.latitude - yy;
  const distance = Math.sqrt(dx * dx + dy * dy) * 111320; // Convert to meters (approximate)


  return {
    latitude: yy,
    longitude: xx,
    distance,
  };
};

// Calculate the distance to the nearest point on a route
export const distanceToRoute = (
  point: { latitude: number; longitude: number },
  routePoints: { latitude: number; longitude: number }[]
): { distance: number; closestPoint: { latitude: number; longitude: number } } => {
  if (routePoints.length < 2) {
    const distance = haversine(
      point.latitude,
      point.longitude,
      routePoints[0]?.latitude || 0,
      routePoints[0]?.longitude || 0
    );
    return {
      distance,
      closestPoint: routePoints[0] || { latitude: 0, longitude: 0 },
    };
  }

  let minDistance = Infinity;
  let closestPoint = { latitude: 0, longitude: 0 };

  for (let i = 0; i < routePoints.length - 1; i++) {
    const segmentStart = routePoints[i];
    const segmentEnd = routePoints[i + 1];
    
    const pointOnSegment = getClosestPointOnSegment(
      point,
      segmentStart,
      segmentEnd
    );

    if (pointOnSegment.distance < minDistance) {
      minDistance = pointOnSegment.distance;
      closestPoint = {
        latitude: pointOnSegment.latitude,
        longitude: pointOnSegment.longitude,
      };
    }
  }

  return {
    distance: minDistance,
    closestPoint,
  };
};

// Calculate the progress along a route in percentage (0-100)
export const calculateRouteProgress = (
  point: { latitude: number; longitude: number },
  routePoints: { latitude: number; longitude: number }[]
): { progress: number; distanceRemaining: number } => {
  if (routePoints.length < 2) {
    return { progress: 0, distanceRemaining: 0 };
  }

  // Find the closest point on the route
  const { closestPoint } = distanceToRoute(point, routePoints);
  
  // Calculate total distance of the route
  let totalDistance = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    totalDistance += haversine(
      routePoints[i].latitude,
      routePoints[i].longitude,
      routePoints[i + 1].latitude,
      routePoints[i + 1].longitude
    );
  }

  // Calculate distance from start to closest point
  let distanceToClosest = 0;
  let found = false;
  
  for (let i = 0; i < routePoints.length - 1 && !found; i++) {
    const segmentStart = routePoints[i];
    const segmentEnd = routePoints[i + 1];
    
    // Check if the closest point is on this segment
    const pointOnSegment = getClosestPointOnSegment(
      point,
      segmentStart,
      segmentEnd
    );

    if (pointOnSegment.distance < 50) { // Within 50m of the segment
      // Add distance from start of route to start of this segment
      for (let j = 0; j < i; j++) {
        distanceToClosest += haversine(
          routePoints[j].latitude,
          routePoints[j].longitude,
          routePoints[j + 1].latitude,
          routePoints[j + 1].longitude
        );
      }
      
      // Add distance from start of segment to closest point
      distanceToClosest += haversine(
        segmentStart.latitude,
        segmentStart.longitude,
        pointOnSegment.latitude,
        pointOnSegment.longitude
      );
      
      found = true;
    }
  }

  const progress = Math.min(100, Math.max(0, (distanceToClosest / totalDistance) * 100));
  const distanceRemaining = Math.max(0, totalDistance - distanceToClosest);
  
  return { progress, distanceRemaining };
};
