import { useState, useEffect, useCallback } from 'react';
import { TTSSettings } from '../types';

export const useTTS = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>({
    voice: null,
    rate: 1,
    volume: 1,
  });

  const populateVoiceList = useCallback(() => {
    const newVoices = window.speechSynthesis.getVoices();
    setVoices(newVoices);
    if (!settings.voice && newVoices.length > 0) {
      const preferredVoice = newVoices.find(voice => voice.name === 'Google 國語（臺灣）') || 
                             newVoices.find(voice => voice.lang.startsWith('zh-TW')) || 
                             newVoices.find(voice => voice.lang.startsWith('zh')) || // Fallback to any Chinese voice
                             null;
      if (preferredVoice) {
        setSettings(prev => ({ ...prev, voice: preferredVoice }));
      }
    }
  }, [settings.voice]);

  useEffect(() => {
    populateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  }, [populateVoiceList]);

  const speak = useCallback((text: string) => {
    if (!settings.voice || !text) return;

    window.speechSynthesis.cancel();
    
    const parts = text.split('____');

    const speakPartsQueue = (partIndex: number) => {
      if (partIndex >= parts.length) {
        return;
      }

      const currentPart = parts[partIndex].trim();

      if (currentPart === '') {
        if (partIndex < parts.length - 1) {
          setTimeout(() => {
            speakPartsQueue(partIndex + 1);
          }, 500);
        }
        return;
      }

      const utterance = new SpeechSynthesisUtterance(currentPart);
      utterance.voice = settings.voice;
      utterance.rate = settings.rate;
      utterance.volume = settings.volume;
      
      utterance.onend = () => {
        if (partIndex < parts.length - 1) {
          setTimeout(() => {
            speakPartsQueue(partIndex + 1);
          }, 500);
        }
      };
      
      window.speechSynthesis.speak(utterance);
    };

    speakPartsQueue(0);
  }, [settings]);

  return { speak, voices, settings, setSettings };
};