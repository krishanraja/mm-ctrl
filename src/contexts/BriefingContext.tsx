import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { Briefing, PlaybackSpeed, BriefingPlaybackState } from '@/types/briefing';

interface BriefingContextValue {
  briefing: Briefing | null;
  setBriefing: (b: Briefing | null) => void;
  playback: BriefingPlaybackState;
  isSheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  isMiniPlayerVisible: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const BriefingContext = createContext<BriefingContextValue | null>(null);

export function BriefingProvider({ children }: { children: React.ReactNode }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isMiniPlayerVisible, setMiniPlayerVisible] = useState(false);
  const [playback, setPlayback] = useState<BriefingPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1,
    currentSegmentIndex: 0,
    hasListened: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setPlayback(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        currentSegmentIndex: getSegmentIndex(audio.currentTime, briefing),
      }));
    };

    const onLoadedMetadata = () => {
      setPlayback(prev => ({ ...prev, duration: audio.duration }));
    };

    const onPlay = () => {
      setPlayback(prev => ({ ...prev, isPlaying: true, hasListened: true }));
    };

    const onPause = () => {
      setPlayback(prev => ({ ...prev, isPlaying: false }));
    };

    const onEnded = () => {
      setPlayback(prev => ({ ...prev, isPlaying: false }));
      setMiniPlayerVisible(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [briefing]);

  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current?.paused) {
      audioRef.current.play();
    } else {
      audioRef.current?.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setPlayback(prev => ({ ...prev, speed }));
  }, []);

  // Show mini player when sheet closes but audio is playing
  const handleSheetOpen = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open && playback.isPlaying) {
      setMiniPlayerVisible(true);
    }
    if (open) {
      setMiniPlayerVisible(false);
    }
  }, [playback.isPlaying]);

  return (
    <BriefingContext.Provider
      value={{
        briefing,
        setBriefing,
        playback,
        isSheetOpen,
        setSheetOpen: handleSheetOpen,
        isMiniPlayerVisible,
        play,
        pause,
        togglePlay,
        seek,
        setSpeed,
        audioRef,
      }}
    >
      {children}
      {/* Hidden audio element */}
      {briefing?.audio_url && (
        <audio ref={audioRef} src={briefing.audio_url} preload="auto" />
      )}
    </BriefingContext.Provider>
  );
}

export function useBriefingContext() {
  const ctx = useContext(BriefingContext);
  if (!ctx) throw new Error('useBriefingContext must be used within BriefingProvider');
  return ctx;
}

// ── Helpers ─────────────────────────────────────────────────────────

function getSegmentIndex(currentTime: number, briefing: Briefing | null): number {
  if (!briefing?.segments?.length || !briefing.audio_duration_seconds) return 0;
  const segmentDuration = briefing.audio_duration_seconds / briefing.segments.length;
  return Math.min(
    Math.floor(currentTime / segmentDuration),
    briefing.segments.length - 1
  );
}
