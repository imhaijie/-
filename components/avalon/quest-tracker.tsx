"use client";

import { QUEST_TEAM_SIZE, DOUBLE_FAIL_QUESTS } from "@/lib/avalon/types";
import type { QuestResult } from "@/lib/avalon/types";
import { Shield, Skull, Circle } from "lucide-react";

interface QuestTrackerProps {
  playerCount: number;
  currentQuest: number;
  questResults: QuestResult[];
  consecutiveRejects: number;
}

export function QuestTracker({
  playerCount,
  currentQuest,
  questResults,
  consecutiveRejects,
}: QuestTrackerProps) {
  const teamSizes = QUEST_TEAM_SIZE[playerCount] || [];
  const doubleFails = DOUBLE_FAIL_QUESTS[playerCount] || [];

  return (
    <div className="space-y-3">
      {/* Quest circles */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((q) => {
          const result = questResults[q - 1];
          const isActive = q === currentQuest;
          const teamSize = teamSizes[q - 1];
          const needsDoubleFail = doubleFails.includes(q);

          return (
            <div key={q} className="flex flex-col items-center gap-1">
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                  result === "success"
                    ? "border-good bg-[hsl(210_80%_55%/0.15)]"
                    : result === "fail"
                    ? "border-evil bg-[hsl(0_72%_51%/0.15)]"
                    : isActive
                    ? "border-primary bg-primary/10 animate-pulse-glow"
                    : "border-border bg-secondary/50"
                }`}
              >
                {result === "success" ? (
                  <Shield className="h-5 w-5 text-good" />
                ) : result === "fail" ? (
                  <Skull className="h-5 w-5 text-evil" />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {q}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {teamSize}人{needsDoubleFail ? "*" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Reject tracker */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">投票轮次:</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all ${
              i <= consecutiveRejects
                ? i === 5
                  ? "bg-evil"
                  : "bg-primary"
                : "bg-secondary"
            }`}
          />
        ))}
        {consecutiveRejects >= 3 && (
          <span className="ml-1 text-xs text-evil">
            {consecutiveRejects}/5
          </span>
        )}
      </div>
    </div>
  );
}
