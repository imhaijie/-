"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, SkipForward, Bell, BellOff } from "lucide-react";

interface SpeechTimerProps {
  duration: number;
  playerName: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

function playAlertSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Play 3 short beeps
    const playBeep = (startTime: number, freq: number, dur: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);
      osc.start(startTime);
      osc.stop(startTime + dur);
    };

    const now = audioCtx.currentTime;
    playBeep(now, 880, 0.15);
    playBeep(now + 0.2, 880, 0.15);
    playBeep(now + 0.4, 1100, 0.3);
  } catch {
    // Silently fail if AudioContext not supported
  }
}

function playTickSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600;
    osc.type = "sine";
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Silently fail
  }
}

export function SpeechTimer({
  duration,
  playerName,
  onComplete,
  onSkip,
}: SpeechTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPlayedAlertRef = useRef(false);

  const progress = timeLeft / duration;
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isExpired = timeLeft <= 0;

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 10 && next > 0 && soundEnabled) {
            playTickSound();
          }
          if (next <= 0) {
            setIsRunning(false);
            if (soundEnabled && !hasPlayedAlertRef.current) {
              playAlertSound();
              hasPlayedAlertRef.current = true;
            }
            setShowExpiredAlert(true);
            onComplete?.();
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, onComplete, soundEnabled]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration);
    setShowExpiredAlert(false);
    hasPlayedAlertRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [duration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">
          {playerName} 发言中
        </p>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={soundEnabled ? "关闭提示音" : "开启提示音"}
        >
          {soundEnabled ? (
            <Bell className="h-3.5 w-3.5" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Expired overlay alert */}
      {showExpiredAlert && (
        <div className="animate-scale-in rounded-lg border-2 border-evil bg-[hsl(0_72%_51%/0.15)] px-6 py-3 text-center">
          <p className="text-lg font-bold text-evil animate-pulse">
            发言时间到！
          </p>
        </div>
      )}

      {/* Circular timer */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={
              isExpired
                ? "hsl(var(--destructive))"
                : isWarning
                ? "hsl(43 74% 49%)"
                : "hsl(var(--primary))"
            }
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span
          className={`absolute text-2xl font-bold tabular-nums ${
            isExpired
              ? "text-destructive"
              : isWarning
              ? "text-primary animate-pulse"
              : "text-foreground"
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant={isRunning ? "secondary" : "default"}
          size="icon"
          className="h-12 w-12"
          onClick={() => {
            if (isExpired) {
              handleReset();
            } else {
              setIsRunning(!isRunning);
            }
          }}
        >
          {isRunning ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        {onSkip && (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              handleReset();
              onSkip();
            }}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
