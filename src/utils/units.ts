// src/utils/units.ts

export const KM_TO_MILES = 0.621371;
export const MILES_TO_KM = 1 / KM_TO_MILES;

/**
 * Converts decimal minutes to a time string "mm:ss".
 * @param decimalMinutes - The time in decimal minutes (e.g., 5.5 for 5 minutes and 30 seconds).
 * @returns A string formatted as "mm:ss".
 */
export const decimalMinutesToTime = (decimalMinutes: number): string => {
  if (isNaN(decimalMinutes) || decimalMinutes < 0) {
    return '--:--';
  }
  const totalSeconds = Math.round(decimalMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Formats distance for display based on the selected unit.
 * @param distanceMeters - Distance in meters.
 * @param displayUnit - The unit to display ('km' or 'mi').
 * @returns Formatted distance string (e.g., "10.5 km" or "6.5 mi").
 */
export const formatDistanceDisplay = (
  distanceMeters: number | undefined,
  displayUnit: 'km' | 'mi',
): string => {
  if (distanceMeters === undefined || isNaN(distanceMeters)) {
    return `0.0 ${displayUnit}`;
  }
  const distanceKm = distanceMeters / 1000;
  if (displayUnit === 'mi') {
    const distanceMiles = distanceKm * KM_TO_MILES;
    return `${distanceMiles.toFixed(1)} mi`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Formats average pace for display based on the selected unit.
 * @param avgPaceMinPerKm - Average pace in minutes per kilometer (decimal).
 * @param displayUnit - The unit to display ('km' or 'mi').
 * @returns Formatted pace string (e.g., "05:30 /km" or "08:52 /mi").
 */
export const formatPaceDisplay = (
  avgPaceMinPerKm: number | undefined,
  displayUnit: 'km' | 'mi',
): string => {
  if (avgPaceMinPerKm === undefined || isNaN(avgPaceMinPerKm) || avgPaceMinPerKm <= 0) {
    return `--:-- /${displayUnit}`;
  }

  let paceToFormat = avgPaceMinPerKm;
  let unitSuffix = `/${displayUnit}`;

  if (displayUnit === 'mi') {
    paceToFormat = avgPaceMinPerKm * KM_TO_MILES; // Convert pace to min/mile
  }

  return `${decimalMinutesToTime(paceToFormat)} ${unitSuffix}`;
};

/**
 * Converts a pace string (e.g., "mm:ss") to decimal minutes.
 * @param paceString - Pace in "mm:ss" format.
 * @returns Pace in decimal minutes, or null if invalid format.
 */
export const paceStringToDecimalMinutes = (paceString: string): number | null => {
  const parts = paceString.split(':');
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  if (isNaN(minutes) || isNaN(seconds) || seconds < 0 || seconds >= 60 || minutes < 0) {
    return null;
  }
  return minutes + seconds / 60;
};

/**
 * Formats a pace value (which might be a string like '5:30' or a number representing min/km)
 * for display, considering the target display unit.
 * This is useful for splits where pace is stored as a string.
 * @param paceValue - Pace, either as a string 'mm:ss' (assumed to be per km) or a number (min/km).
 * @param displayUnit - The target unit for display ('km' or 'mi').
 * @returns Formatted pace string (e.g., "05:30 /km" or "08:52 /mi").
 */
/**
 * Formats a duration in total seconds into a human-readable string (e.g., "1h 05m 30s", "05m 30s", "30s").
 * @param totalSeconds - The total duration in seconds.
 * @returns A formatted string representing the duration.
 */
export const formatDurationDisplay = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '0s'; // Or some other default like '--:--:--'
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
};

export const formatSplitPaceDisplay = (
  paceValue: string | number | undefined,
  displayUnit: 'km' | 'mi',
): string => {
  if (paceValue === undefined) {
    return `--:-- /${displayUnit}`;
  }

  let paceMinPerKm: number | null;

  if (typeof paceValue === 'string') {
    paceMinPerKm = paceStringToDecimalMinutes(paceValue);
  } else {
    paceMinPerKm = paceValue;
  }

  if (paceMinPerKm === null || isNaN(paceMinPerKm) || paceMinPerKm <= 0) {
    return `--:-- /${displayUnit}`;
  }

  return formatPaceDisplay(paceMinPerKm, displayUnit);
};
