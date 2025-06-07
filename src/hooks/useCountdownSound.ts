import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export const useCountdownSound = () => {
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Load and unload sound resources
  useEffect(() => {
    // Clean up function to unload sound when component unmounts
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Play a beep sound based on the countdown value
  const playCountdownSound = async (countdownValue: number) => {
    try {
      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Create a new sound
      const { sound } = await Audio.Sound.createAsync(
        // Use different sound for final beep vs regular countdown beeps
        countdownValue === 1 
          ? require('../assets/sounds/final-beep.mp3') 
          : require('../assets/sounds/count-beep.mp3'),
        { volume: 1.0 }
      );
      
      soundRef.current = sound;
      
      // Play the sound
      await sound.playAsync();
      
    } catch (error) {
      console.log('Error playing countdown sound:', error);
    }
  };

  return { playCountdownSound };
};
