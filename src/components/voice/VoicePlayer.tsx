/**
 * VoicePlayer Component
 * 
 * Voice playback component.
 */

import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

interface VoicePlayerProps {
  audioBlob: Blob | null;
}

export function VoicePlayer({ audioBlob }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlob && !audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [audioBlob]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!audioBlob) {
    return null;
  }

  return (
    <Button onClick={togglePlayback} variant="outline" size="sm">
      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
    </Button>
  );
}
