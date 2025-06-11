import { useCallback, useRef, useEffect } from 'react';
import { useTextToSpeech } from './useTextToSpeech';
// Import AudioCueSettingsData and useUserSettings from the new location
import { useUserSettings } from './useUserSettings';
import { AudioCueSettingsData } from '../types/audioTypes';

interface UseAudioCuesProps {
  settings?: AudioCueSettingsData; // Optional: settings for a specific run
  isTracking: boolean;
  isPausedRef: React.RefObject<boolean>;
  currentPace?: number; // Current pace in min/km or min/mile
  distance?: number; // Current distance in km or miles
  targetPace?: number; // Target pace in min/km or min/mile
  targetDistance?: number; // Target distance in km or miles
  workoutType?: string; // Type of workout, e.g., 'run', 'cycle'
}

export const useAudioCues = ({ settings: runSpecificSettings, isTracking, isPausedRef, currentPace, distance, targetPace, targetDistance, workoutType }: UseAudioCuesProps) => {
  const { settings: userSettings, isLoadingSettings } = useUserSettings();

  // Effective settings should only be calculated once settings are loaded
  const getEffectiveSettings = useCallback((): AudioCueSettingsData => {
    return {
      ...userSettings.audioCueDefaults,
      ...(runSpecificSettings || {}),
    };
  }, [userSettings.audioCueDefaults, runSpecificSettings]);


  const { speak } = useTextToSpeech();
  const lastDistanceAnnouncement = useRef(0); // Stores distance in the unit defined by settings
  const lastPaceCheck = useRef(0); // Timestamp of the last pace check

  const convertPaceToSeconds = useCallback((paceString: string): number => {
    if (!paceString || paceString === '--:--') return Infinity;
    const [mins, secs] = paceString.split(':').map(Number);
    return (mins || 0) * 60 + (secs || 0);
  }, []);

  const convertDistance = useCallback((distanceKm: number, toUnit: 'km' | 'miles'): number => {
    return toUnit === 'miles' ? distanceKm * 0.621371 : distanceKm;
  }, []);

  const formatDistance = useCallback((distance: number, unit: 'km' | 'miles'): string => {
    const roundedDistance = Math.round(distance * 100) / 100; // Round to 2 decimal places
    if (roundedDistance === 0.25) return `quarter ${unit === 'km' ? 'kilometer' : 'mile'}`;
    if (roundedDistance === 0.5) return `half ${unit === 'km' ? 'kilometer' : 'mile'}`;
    
    return `${roundedDistance} ${unit === 'km' ? 'kilometer' : 'mile'}${roundedDistance !== 1 ? 's' : ''}`;
  }, []);

  const formatPace = useCallback((paceString: string): string => {
    if (!paceString || paceString === '--:--') return "unknown pace";
    const [minsStr, secsStr] = paceString.split(':');
    const mins = parseInt(minsStr, 10);
    const secs = parseInt(secsStr, 10);

    let announcement = "";
    if (mins > 0) {
      announcement += `${mins} minute${mins > 1 ? 's' : ''} `;
    }
    if (secs > 0 || mins === 0) { // Announce seconds if non-zero or if minutes are zero
      announcement += `${secs} second${secs > 1 ? 's' : ''}`;
    }
    return announcement.trim();
  }, []);


  const checkDistanceCue = useCallback(async (currentDistanceKm: number) => {
    if (isLoadingSettings || !getEffectiveSettings().announceDistance || !isTracking) return;

    const effectiveSettings = getEffectiveSettings();
    const distanceInConfiguredUnit = convertDistance(currentDistanceKm, effectiveSettings.distanceUnit);
    const intervalDistance = effectiveSettings.distanceInterval;
    
    // Calculate the interval counts with more precision before flooring
    const currentIntervalCount = Math.floor(distanceInConfiguredUnit / intervalDistance);
    const lastIntervalCount = Math.floor(lastDistanceAnnouncement.current / intervalDistance);
    
    // Debug logging for distance tracking
    console.log(
      `AUDIO CUE DEBUG: distanceKm=${currentDistanceKm.toFixed(3)}, ` +
      `unit=${effectiveSettings.distanceUnit}, ` +
      `converted=${distanceInConfiguredUnit.toFixed(3)}, ` +
      `interval=${intervalDistance}, ` +
      `currentCount=${currentIntervalCount}, ` +
      `lastCount=${lastIntervalCount}, ` +
      `lastAnnounced=${lastDistanceAnnouncement.current.toFixed(3)}`
    );

    // Check if we've crossed an interval boundary
    if (currentIntervalCount > lastIntervalCount && currentIntervalCount > 0) {
      // Use exact interval multiple for announcement
      const announcementDistance = currentIntervalCount * intervalDistance;
      const formattedDistance = formatDistance(announcementDistance, effectiveSettings.distanceUnit);
      
      console.log(`ANNOUNCING: ${formattedDistance} completed`);
      await speak(`${formattedDistance} completed`, 'medium');
      
      // Store the exact distance we announced to avoid floating point issues
      lastDistanceAnnouncement.current = announcementDistance; 
    }
  }, [isLoadingSettings, getEffectiveSettings, isTracking, convertDistance, formatDistance, speak]);

  const checkPaceCue = useCallback(async (currentPace: string, avgPace: string) => {
    if (isLoadingSettings || !getEffectiveSettings().announcePace || !isTracking || currentPace === '--:--') return;

    const effectiveSettings = getEffectiveSettings();
    const now = Date.now();
    // Check pace cue not more than once every 30 seconds
    if (now - lastPaceCheck.current < 30000) return;

    // Ensure we have valid strings for pace calculations
    const targetPace: string = effectiveSettings.targetPace || '5:00';
    const targetPaceSeconds = convertPaceToSeconds(targetPace);
    const currentPaceSeconds = convertPaceToSeconds(currentPace);
    const tolerance: number = effectiveSettings.paceTolerance || 10;

    if (currentPaceSeconds === Infinity || targetPaceSeconds === Infinity) return;

    const difference = currentPaceSeconds - targetPaceSeconds;

    if (Math.abs(difference) > tolerance) {
      if (difference > 0) {
        await speak(`Pace too slow. Current pace ${formatPace(currentPace)}. Target ${formatPace(targetPace)}`, 'high');
      } else {
        await speak(`Pace too fast. Current pace ${formatPace(currentPace)}. Target ${formatPace(targetPace)}`, 'high');
      }
      lastPaceCheck.current = now; // Update only if an announcement was made
    }
  }, [isLoadingSettings, getEffectiveSettings, isTracking, convertPaceToSeconds, formatPace, speak]);
  
  const announceWorkoutStart = useCallback(async () => {
    if (isTracking && !isLoadingSettings) {
      await speak('Workout started.', 'medium');
    }
  }, [isTracking, isLoadingSettings, speak]);

  const announceWorkoutEnd = useCallback(async (duration: number, distanceKm: number, avgPace: string) => {
    if (isLoadingSettings) return;

    const effectiveSettings = getEffectiveSettings();
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    let timeAnnouncement = "";
    if (minutes > 0) {
        timeAnnouncement += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    }
    if (seconds > 0 || minutes === 0) { // Announce seconds if non-zero or if minutes are zero
        timeAnnouncement += `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
    timeAnnouncement = timeAnnouncement.trim();

    const distanceInConfiguredUnit = convertDistance(distanceKm, effectiveSettings.distanceUnit);
    const formattedDistance = formatDistance(distanceInConfiguredUnit, effectiveSettings.distanceUnit);
    
    const paceInfo = (avgPace && avgPace !== '--:--') ? ` at an average pace of ${formatPace(avgPace)}` : '';
    
    await speak(`Workout complete! You ran ${formattedDistance} in ${timeAnnouncement}${paceInfo}. Great job!`, 'high');
  }, [isLoadingSettings, getEffectiveSettings, convertDistance, formatDistance, formatPace, speak]);

  const announceSplit = useCallback(async (splitNumber: number, formattedSplitPace: string) => {
    if (isLoadingSettings || !getEffectiveSettings().splitAnnouncementsEnabled || !isTracking) return;

    if (formattedSplitPace && formattedSplitPace !== 'Pace not available') {
      await speak(`Split ${splitNumber}, pace ${formattedSplitPace}`, 'medium');
    } else {
      await speak(`Split ${splitNumber} completed.`, 'medium');
    }
  }, [isLoadingSettings, getEffectiveSettings, isTracking, speak]);

  // Reset refs when tracking stops or settings change significantly (e.g. unit change)
  useEffect(() => {
    if (!isTracking || isLoadingSettings) {
      lastDistanceAnnouncement.current = 0;
      lastPaceCheck.current = 0;
    }
  }, [isTracking, isLoadingSettings, userSettings.audioCueDefaults.distanceUnit]);


  return {
    checkDistanceCue,
    checkPaceCue,
    announceWorkoutStart,
    announceWorkoutEnd,
    announceSplit,
    // announceDistanceUpdate is not used in WorkoutTracker, can be removed or kept
  };
};
