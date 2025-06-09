// Type declarations for TimeFormatter.ts
declare module '../utils/TimeFormatter' {
  export function formatTime(seconds: number): string;
  export function formatTimeHMS(seconds: number): string;
  export function formatTimeHM(seconds: number): string;
  export function formatTimeDuration(seconds: number): string;
  export function formatTimeForDisplay(seconds: number): string;
}
