import { useCallback, useState, useEffect } from 'react';
import * as Speech from 'expo-speech';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true); // expo-speech is generally available if installed

  useEffect(() => {
    // Optional: Check for available voices or specific capabilities if needed
    // For now, we assume expo-speech is supported if the module is present.
    // Cleanup function to stop speech if component unmounts
    return () => {
      Speech.stop();
    };
  }, []);

  const speak = useCallback(
    async (text: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
      try {
        const speaking = await Speech.isSpeakingAsync();
        if (speaking) {
          if (priority === 'high') {
            await Speech.stop(); // Stop current speech for high priority
          } else {
            // For medium/low, if already speaking, maybe queue or skip.
            // For simplicity, we'll let expo-speech handle queuing or overlap if any.
            // console.log('TTS: Already speaking, new request:', text);
            // return; // Or queue it
          }
        }

        setIsSpeaking(true);
        // console.log('TTS started:', text);

        // Expo Speech options
        const options: Speech.SpeechOptions = {
          // language: 'en-US', // You can specify language
          // pitch: 1.0,
          // rate: 0.9,
          // volume: 0.8, // Not directly supported in options, managed by device volume
          onStart: () => {
            // console.log('TTS onStart event:', text);
            // setIsSpeaking(true); // Already set
          },
          onDone: () => {
            // console.log('TTS onDone event:', text);
            setIsSpeaking(false);
          },
          onStopped: () => {
            // console.log('TTS onStopped event:', text);
            setIsSpeaking(false);
          },
          onError: (error) => {
            console.error('TTS error:', error);
            setIsSpeaking(false);
          },
        };

        await Speech.speak(text, options);
      } catch (error) {
        console.error('TTS speak function error:', error);
        setIsSpeaking(false);
        setIsSupported(false); // Mark as not supported on error
      }
    },
    []
  );

  const cancelSpeech = useCallback(async () => {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await Speech.stop();
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS cancelSpeech function error:', error);
    }
  }, []);

  return { speak, cancelSpeech, isSupported, isSpeaking };
};
