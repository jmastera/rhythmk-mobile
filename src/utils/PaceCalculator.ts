// Pace calculation utilities

export const metersPerSecondToMinPerKm = (mps: number): number => {
  if (mps <= 0) return 0;
  // Convert m/s to min/km
  // 1 km = 1000m, so time to cover 1km = 1000/mps seconds
  // Convert seconds to minutes
  return 1000 / mps / 60;
};

export const metersPerSecondToMinPerMile = (mps: number): number => {
  if (mps <= 0) return 0;
  // 1 mile = 1609.344m
  return 1609.344 / mps / 60;
};

export const decimalMinutesToTime = (decimalMinutes: number): { minutes: number, seconds: number } => {
  if (decimalMinutes === 0 || isNaN(decimalMinutes)) {
    return { minutes: 0, seconds: 0 };
  }
  
  const totalSeconds = Math.round(decimalMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return { minutes, seconds };
};

// Format pace for display (e.g., "8:30" for 8 min 30 sec per km/mi)
export const formatPaceDisplay = (paceInDecimalMinutes: number, unit: 'km' | 'miles'): string => {
  if (paceInDecimalMinutes <= 0 || isNaN(paceInDecimalMinutes)) {
    return '--:--';
  }
  
  const { minutes, seconds } = decimalMinutesToTime(paceInDecimalMinutes);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format distance in meters to km or miles with appropriate precision
export const formatDistanceDisplay = (distanceInMeters: number, unit: 'km' | 'miles' = 'km'): string => {
  if (distanceInMeters === 0 || isNaN(distanceInMeters)) {
    return '0.00';
  }
  
  const distance = unit === 'km' 
    ? distanceInMeters / 1000 
    : distanceInMeters / 1609.344;
  
  return distance.toFixed(2);
};

// Format duration in seconds to HH:MM:SS or MM:SS format
export const formatDurationDisplay = (durationInSeconds: number): string => {
  if (durationInSeconds === 0 || isNaN(durationInSeconds)) {
    return '00:00';
  }
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};
