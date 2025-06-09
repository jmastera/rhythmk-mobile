// Type declarations for PaceCalculator.ts
declare module '../utils/PaceCalculator' {
  export function decimalMinutesToTime(decimalMinutes: number): string;
  export function metersPerSecondToMinPerKm(speedMps: number): number | null;
  export function formatDistanceDisplay(distance: number, unit?: string): string;
  export function formatPaceDisplay(pace: number | null, unit?: string): string;
  export function formatDurationDisplay(durationSeconds: number): string;
  export function calculatePace(distanceInKm: number, durationInSeconds: number): number | null;
  export function convertPaceToSeconds(paceString: string): number;
  export function normalizeUnit(unit: string): 'km' | 'miles';
}
