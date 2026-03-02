import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  audioData: string;
  format?: string;
  bubbleColor?: string;
  textColor?: string;
}

const AudioPlayer = ({ audioData, format = "mp3", bubbleColor, textColor }: AudioPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const audio = new Audio(`data:audio/${format};base64,${audioData}`);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioData, format]);

  const updateProgress = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1));
      if (!audioRef.current.paused) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      cancelAnimationFrame(animFrameRef.current);
    } else {
      audioRef.current.play();
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Generate waveform bars
  const bars = Array.from({ length: 28 }, (_, i) => {
    const h = 8 + Math.sin(i * 0.8) * 6 + Math.cos(i * 1.3) * 4 + Math.random() * 2;
    return Math.max(4, Math.min(20, h));
  });

  return (
    <div className="flex items-center gap-2 py-1 min-w-[220px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
        style={{ backgroundColor: `${textColor || "#fff"}20` }}
      >
        {playing ? (
          <Pause size={14} style={{ color: textColor || "#fff" }} fill={textColor || "#fff"} />
        ) : (
          <Play size={14} style={{ color: textColor || "#fff" }} fill={textColor || "#fff"} className="ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-end gap-[1.5px] h-5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full transition-all duration-75"
              style={{
                height: `${h}px`,
                backgroundColor: i / bars.length <= progress
                  ? (textColor || "#fff")
                  : `${textColor || "#fff"}40`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] opacity-60" style={{ color: textColor }}>
            {playing ? formatTime((audioRef.current?.currentTime || 0)) : formatTime(duration || 0)}
          </span>
          <Volume2 size={10} style={{ color: textColor, opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
