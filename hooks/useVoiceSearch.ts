import { useState, useCallback, useEffect } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform, Alert } from 'react-native';

export interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const available = await ExpoSpeechRecognitionModule.getStateAsync();
      setIsAvailable(available !== 'inactive');
    } catch (err) {
      console.error('Speech recognition not available:', err);
      setIsAvailable(false);
    }
  };

  // Listen for speech recognition events
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.error);
    setIsListening(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const results = event.results;
    if (results && results.length > 0) {
      const result = results[0];
      if (result?.transcript) {
        setTranscript(result.transcript);
        // Check if this is a final result
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  });

  const startListening = useCallback(async (
    language: string = 'fr-FR',
    continuous: boolean = false
  ) => {
    if (!isAvailable) {
      Alert.alert(
        'Non disponible',
        'La reconnaissance vocale n\'est pas disponible sur cet appareil.'
      );
      return false;
    }

    try {
      setTranscript('');
      setError(null);

      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setError('Permission refusée');
        return false;
      }

      await ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        maxAlternatives: 1,
        continuous,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: [
          'produit',
          'prix',
          'acheter',
          'panier',
          'rechercher',
        ],
      });

      return true;
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setError(err.message || 'Erreur lors du démarrage');
      return false;
    }
  }, [isAvailable]);

  const stopListening = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (err: any) {
      console.error('Error stopping speech recognition:', err);
      setError(err.message || 'Erreur lors de l\'arrêt');
    }
  }, []);

  const speak = useCallback(async (
    text: string,
    options?: {
      language?: string;
      pitch?: number;
      rate?: number;
    }
  ) => {
    try {
      setIsSpeaking(true);

      await Speech.speak(text, {
        language: options?.language || 'fr-FR',
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 1.0,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (err: any) {
      console.error('Error speaking:', err);
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (err: any) {
      console.error('Error stopping speech:', err);
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
    if (isListening) {
      stopListening();
    }
  }, [isListening, stopListening]);

  // Voice command processor
  const processVoiceCommand = useCallback((text: string): {
    action: string;
    query?: string;
  } | null => {
    const lowerText = text.toLowerCase().trim();

    // Search commands
    if (lowerText.includes('recherche') || lowerText.includes('cherche') || lowerText.includes('trouve')) {
      const query = lowerText
        .replace(/recherche|cherche|trouve/gi, '')
        .trim();
      return { action: 'search', query };
    }

    // Cart commands
    if (lowerText.includes('panier')) {
      return { action: 'cart' };
    }

    // Profile commands
    if (lowerText.includes('profil') || lowerText.includes('compte')) {
      return { action: 'profile' };
    }

    // Home command
    if (lowerText.includes('accueil')) {
      return { action: 'home' };
    }

    // Help command
    if (lowerText.includes('aide')) {
      return { action: 'help' };
    }

    return null;
  }, []);

  return {
    isListening,
    transcript,
    error,
    isAvailable,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    reset,
    processVoiceCommand,
  };
}

export default useVoiceSearch;
