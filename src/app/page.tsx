'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  description: string;
  preview_url: string;
}

export default function Page() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isListVisible, setIsListVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentPlayingVoiceId, setCurrentPlayingVoiceId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          setVoices(data.voices);
        } else {
          console.error('Failed to fetch voices');
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };

    fetchVoices();
  }, []);

  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (text.trim() && selectedVoice) {
      setIsLoading(true);

      try {
        const response = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voiceId: selectedVoice.voice_id }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setAudioSrc(url);
          setIsLoading(false);
        } else {
          console.error('Failed to fetch audio');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching audio:', error);
        setIsLoading(false);
      }
    } else {
      console.error('No text or voice selected');
    }
  };

  const handlePlayPreview = (voiceId: string, previewUrl: string) => {
    const existingAudio = audioElements[voiceId];

    if (existingAudio) {
      if (existingAudio.paused) {
        existingAudio.play();
        setCurrentPlayingVoiceId(voiceId);
      } else {
        existingAudio.pause();
        setCurrentPlayingVoiceId(null);
      }
    } else {
      const newAudio = new Audio(previewUrl);
      newAudio.onended = () => setCurrentPlayingVoiceId(null);
      newAudio.play();
      setAudioElements(prev => ({ ...prev, [voiceId]: newAudio }));
      setCurrentPlayingVoiceId(voiceId);
    }
  };

  const handleVoiceSelection = (voice: Voice) => {
    setSelectedVoice(voice);
    setIsListVisible(false);
  };

  const toggleListVisibility = () => {
    setIsListVisible(!isListVisible);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Text to Speech</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.buttonContainer}>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text here"
          />
          <button
            className={styles.generateButton}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Generate Audio'}
          </button>
        </div>
      </form>

      {audioSrc && (
        <audio className={styles.audioPlayer} ref={audioRef} src={audioSrc} controls preload="auto" />
      )}

      <button
        className={styles.selectButton}
        onClick={toggleListVisibility}
      >
        {selectedVoice ? selectedVoice.name : 'Select a Voice'}
      </button>

      <div className={`${styles.showContent} ${isListVisible ? styles.visible : ''}`}>
        <ul className={styles.voiceList}>
          {voices.map((voice) => (
            <li
              key={voice.voice_id}
              className={`${styles.voiceItem} ${selectedVoice?.voice_id === voice.voice_id ? styles.selectedVoice : ''}`}
            >
              <span className={styles.voiceName}>{voice.name}</span>
              <div className={styles.buttons}>
                <button
                  className={styles.button}
                  onClick={() => handlePlayPreview(voice.voice_id, voice.preview_url)}
                >
                  {currentPlayingVoiceId === voice.voice_id ? 'Pause' : 'Play'}
                </button>
                <button
                  className={styles.button}
                  onClick={() => handleVoiceSelection(voice)}
                >
                  Select
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedVoice && (
        <div>
          <h3 className={styles.voiceName}>{selectedVoice.name}</h3>
          <p>Category: {selectedVoice.category}</p>
          <div>
            <p>Labels:</p>
            <ul>
              {Object.entries(selectedVoice.labels).map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
          </div>
          <p>Description: {selectedVoice.description || 'No description available'}</p>
        </div>
      )}
    </div>
  );
}
