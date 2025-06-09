// Type declarations for PaceCalculator.ts
export type DistanceUnit = 'km' | 'miles';

export function metersPerSecondToMinPerKm(mps: number): number;
export function decimalMinutesToTime(decimalMinutes: number): string;
export function formatPaceDisplay(pace: number, unit?: DistanceUnit): string; 
export function formatDistanceDisplay(meters: number, unit?: DistanceUnit): string;
export function formatDurationDisplay(seconds: number): string;
