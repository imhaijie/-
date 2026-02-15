"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Bell,
  BellOff,
} from "lucide-react";
import { unlockAudio, playTick, playAlert } from "@/lib/avalon/audio";

interface SpeechTimerProps {
  duration: number;
  playerName: string;
  onComplete?: () => void;
  onSkip?: () => void;
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

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 10 && next > 0 && soundEnabled) {
            playTick();
          }
          if (next <= 0) {
            setIsRunning(false);
            if (soundEnabled && !hasPlayedAlertRef.current) {
              playAlert();
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

  const handlePlayPause = () => {
    // Unlock audio on user gesture
    unlockAudio();
    if (isExpired) {
      handleReset();
    } else {
      setIsRunning(!isRunning);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground lg:text-base">
          {playerName} 发言中
        </p>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={soundEnabled ? "关闭提示音" : "开启提示音"}
        >
          {soundEnabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expired overlay alert */}
      {showExpiredAlert && (
        <div className="w-full animate-scale-in rounded-lg border-2 border-destructive bg-destructive/15 px-6 py-4 text-center">
          <p className="animate-pulse text-xl font-bold text-destructive lg:text-2xl">
            发言时间到！
          </p>
        </div>
      )}

      {/* Circular timer */}
      <div className="relative flex h-36 w-36 items-center justify-center lg:h-44 lg:w-44">
        <svg className="-rotate-90" viewBox="0 0 120 120" width="100%" height="100%">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={
              isExpired
                ? "hsl(var(--destructive))"
                : isWarning
                  ? "hsl(43 74% 49%)"
                  : "hsl(var(--primary))"
            }
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span
          className={`absolute text-3xl font-bold tabular-nums lg:text-4xl ${
            isExpired
              ? "text-destructive"
              : isWarning
                ? "animate-pulse text-primary"
                : "text-foreground"
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant={isRunning ? "secondary" : "default"}
          size="icon"
          className="h-14 w-14"
          onClick={handlePlayPause}
        >
          {isRunning ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
        {onSkip && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
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
