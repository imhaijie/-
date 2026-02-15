"use client";

import { Button } from "@/components/ui/button";
import { Shield, Skull, ChevronRight, Swords } from "lucide-react";
import { useGame } from "@/lib/avalon/store";
import { QuestTracker } from "./quest-tracker";

export function QuestResultPhase() {
  const { state, dispatch } = useGame();

  const currentQuest = state.quests[state.quests.length - 1];
  const questResults = state.quests.map((q) => q.result);
  const isSuccess = currentQuest.result === "success";

  const handleNext = () => {
    dispatch({ type: "ADVANCE_QUEST" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-4">
      <QuestTracker
        playerCount={state.playerCount}
        currentQuest={state.currentQuest}
        questResults={questResults}
        consecutiveRejects={state.consecutiveRejects}
      />

      <div className="mt-8 w-full max-w-lg animate-scale-in">
        {/* Result display */}
        <div
          className={`rounded-lg border-2 p-8 text-center ${
            isSuccess
              ? "border-good/30 bg-[hsl(210_80%_55%/0.08)]"
              : "border-evil/30 bg-[hsl(0_72%_51%/0.08)]"
          }`}
        >
          {isSuccess ? (
            <Shield className="mx-auto mb-4 h-16 w-16 text-good" />
          ) : (
            <Skull className="mx-auto mb-4 h-16 w-16 text-evil" />
          )}

          <h2
            className={`mb-2 text-3xl font-bold ${
              isSuccess ? "text-good" : "text-evil"
            }`}
          >
            {isSuccess ? "任务成功" : "任务失败"}
          </h2>

          <p className="text-sm text-muted-foreground">
            第 {state.currentQuest} 轮任务
          </p>

          {/* Fail count */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-good" />
              <span className="text-sm text-good">
                成功: {currentQuest.finalTeam.length - currentQuest.failCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Skull className="h-4 w-4 text-evil" />
              <span className="text-sm text-evil">
                失败: {currentQuest.failCount}
              </span>
            </div>
          </div>

          {currentQuest.requiresDoubleFail && (
            <p className="mt-2 text-xs text-muted-foreground">
              (此轮需要2张失败牌才算失败)
            </p>
          )}
        </div>

        {/* Score summary */}
        <div className="mt-6 flex gap-4">
          <div className="flex flex-1 flex-col items-center rounded-lg border border-good/20 bg-[hsl(210_80%_55%/0.05)] p-4">
            <Shield className="mb-1 h-6 w-6 text-good" />
            <span className="text-2xl font-bold text-good">
              {state.goodWins}
            </span>
            <span className="text-xs text-muted-foreground">正义方</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-lg border border-evil/20 bg-[hsl(0_72%_51%/0.05)] p-4">
            <Skull className="mb-1 h-6 w-6 text-evil" />
            <span className="text-2xl font-bold text-evil">
              {state.evilWins}
            </span>
            <span className="text-xs text-muted-foreground">邪恶方</span>
          </div>
        </div>

        {/* Team that executed */}
        <div className="mt-4 rounded-md border border-border bg-card p-3">
          <p className="mb-2 text-xs text-muted-foreground">执行队伍</p>
          <div className="flex flex-wrap gap-1.5">
            {currentQuest.finalTeam.map((id) => {
              const player = state.players.find((p) => p.id === id);
              return (
                <div
                  key={id}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
                >
                  {player?.name}
                </div>
              );
            })}
          </div>
        </div>

        <Button className="mt-6 w-full" size="lg" onClick={handleNext}>
          继续
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
