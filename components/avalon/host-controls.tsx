"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  History,
  RotateCcw,
  X,
  ChevronUp,
  Settings,
  Clock,
} from "lucide-react";
import { useGame } from "@/lib/avalon/store";

export function HostControls() {
  const { state, snapshots, restoreToSnapshot } = useGame();
  const [showHistory, setShowHistory] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleRestore = (snapshotId: string) => {
    restoreToSnapshot(snapshotId);
    setShowHistory(false);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      {/* Floating control button */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {showControls && (
          <div className="animate-fade-in-up flex flex-col gap-2 rounded-lg border border-border bg-card p-2 shadow-lg">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => setShowHistory(true)}
              disabled={snapshots.length === 0}
            >
              <History className="h-4 w-4" />
              撤回历史
              {snapshots.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  ({snapshots.length})
                </span>
              )}
            </Button>
          </div>
        )}
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setShowControls(!showControls)}
        >
          {showControls ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <Settings className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 max-h-[80vh] w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <History className="h-5 w-5 text-primary" />
                操作历史
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowHistory(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {snapshots.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  暂无历史记录
                </p>
              ) : (
                <div className="space-y-2">
                  {[...snapshots].reverse().map((snapshot, index) => {
                    const isLatest = index === 0;
                    const isCurrent = snapshot.phase === state.phase;

                    return (
                      <div
                        key={snapshot.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                          isCurrent
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-secondary/30 hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {snapshot.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(snapshot.timestamp)}
                          </p>
                        </div>
                        {!isLatest && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1"
                            onClick={() => handleRestore(snapshot.id)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            撤回
                          </Button>
                        )}
                        {isLatest && (
                          <span className="text-xs text-primary">当前</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3">
              <p className="text-center text-xs text-muted-foreground">
                点击「撤回」可恢复到该时间点的游戏状态
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
