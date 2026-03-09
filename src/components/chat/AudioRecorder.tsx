import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2, Trash2, Send } from "lucide-react";
import { playRecordingStartSound, playRecordingStopSound } from "./WhatsAppSounds";

interface AudioRecorderProps {
  onAudioRecorded: (base64: string, format: string) => void;
  disabled?: boolean;
  accentColor?: string;
  onRecordingChange?: (recording: boolean) => void;
}

const AudioRecorder = ({ onAudioRecorded, disabled, accentColor = "#00a884", onRecordingChange }: AudioRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [bars, setBars] = useState<number[]>(Array(24).fill(4));
  const rafRef = useRef<number>(0);

  // Timer for recording duration
  useEffect(() => {
    if (recording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  // Waveform animation from mic input
  useEffect(() => {
    if (!recording) {
      cancelAnimationFrame(rafRef.current);
      setBars(Array(24).fill(4));
      return;
    }

    const updateBars = () => {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const step = Math.floor(data.length / 24);
        const newBars = Array.from({ length: 24 }, (_, i) => {
          const val = data[i * step] || 0;
          return Math.max(3, (val / 255) * 28);
        });
        setBars(newBars);
      }
      rafRef.current = requestAnimationFrame(updateBars);
    };
    rafRef.current = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(rafRef.current);
  }, [recording]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Audio analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setProcessing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          onAudioRecorded(base64, "webm");
          setProcessing(false);
        };
        reader.readAsDataURL(blob);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        analyserRef.current = null;
      };

      mediaRecorder.start(250);
      setRecording(true);
      onRecordingChange?.(true);
      playRecordingStartSound();
    } catch (err) {
      console.error("Mic access error:", err);
    }
  }, [onAudioRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      onRecordingChange?.(false);
      playRecordingStopSound();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      // Remove onstop handler to prevent sending
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      analyserRef.current = null;
      chunksRef.current = [];
      setRecording(false);
      onRecordingChange?.(false);
      playRecordingStopSound();
    }
  }, []);

  if (processing) {
    return (
      <button className="p-2 rounded-full" disabled>
        <Loader2 size={20} className="animate-spin" style={{ color: accentColor }} />
      </button>
    );
  }

  // Full recording bar (replaces the entire input bar)
  if (recording) {
    return (
      <div className="flex items-center gap-2 w-full px-2">
        {/* Cancel button */}
        <button
          onClick={cancelRecording}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
          style={{ color: "#ef4444" }}
        >
          <Trash2 size={22} />
        </button>

        {/* Waveform + timer */}
        <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          {/* Red pulsing dot */}
          <div className="w-3 h-3 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: "#ef4444" }} />

          {/* Timer */}
          <span className="text-xs font-mono shrink-0 tabular-nums" style={{ color: "#e9edef", minWidth: "32px" }}>
            {formatElapsed(elapsed)}
          </span>

          {/* Live waveform bars */}
          <div className="flex items-center gap-[2px] flex-1 h-7 justify-center overflow-hidden">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full transition-all duration-75"
                style={{
                  height: `${h}px`,
                  backgroundColor: accentColor,
                  opacity: 0.7 + (h / 28) * 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={stopRecording}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
          style={{ backgroundColor: accentColor }}
        >
          <Send size={18} className="text-white ml-0.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="p-2 rounded-full transition-colors hover:opacity-80 disabled:opacity-30"
    >
      <Mic size={20} style={{ color: disabled ? "#8696a0" : accentColor }} />
    </button>
  );
};

export default AudioRecorder;
