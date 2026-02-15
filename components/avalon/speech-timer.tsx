"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Play, Pause, RotateCcw, SkipForward } from "lucide-react";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = timeLeft / duration;
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isExpired = timeLeft <= 0;

  // Circumference for the circular progress
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, onComplete]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [duration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted-foreground">
        {playerName} 发言中
      </p>

      {/* Circular timer */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="6"
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
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span
          className={`absolute text-lg font-bold ${
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
          className="h-11 w-11"
          onClick={() => setIsRunning(!isRunning)}
          disabled={isExpired}
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
            onClick={onSkip}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
