"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Skull, AlertTriangle, Crown } from "lucide-react";
import { useGame } from "@/lib/avalon/store";

export function AssassinationPhase() {
  const { state, dispatch } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [confirmMode, setConfirmMode] = useState(false);

  const assassin = state.players.find((p) => p.role === "assassin");
  const goodPlayers = state.players.filter((p) => p.alignment === "good");

  const handleConfirmKill = () => {
    if (selectedTarget === null) return;
    dispatch({ type: "SUBMIT_ASSASSINATION", targetId: selectedTarget });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
      <div className="mb-6 text-center">
        <Target className="mx-auto mb-3 h-12 w-12 text-evil" />
        <h1 className="mb-1 text-2xl font-bold text-evil">
          刺客刺杀环节
        </h1>
        <p className="text-sm text-muted-foreground">
          正义方已完成三个任务，但邪恶方还有最后一次机会
        </p>
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-4 rounded-lg border border-evil/20 bg-[hsl(0_72%_51%/0.08)] p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-evil" />
            <div>
              <p className="text-sm font-medium text-evil">
                刺客：{assassin?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                邪恶阵营讨论后，由刺客选择一名玩家刺杀
              </p>
              <p className="text-xs text-muted-foreground">
                如果刺中梅林，邪恶方获胜
              </p>
            </div>
          </div>
        </div>

        {!confirmMode ? (
          <>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              选择刺杀目标
            </h3>
            <div className="space-y-2">
              {goodPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedTarget(player.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                    selectedTarget === player.id
                      ? "border-evil bg-[hsl(0_72%_51%/0.1)]"
                      : "border-border bg-card hover:border-evil/30"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      selectedTarget === player.id
                        ? "bg-evil text-evil-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {selectedTarget === player.id ? (
                      <Target className="h-4 w-4" />
                    ) : (
                      <span className="text-sm">{player.id + 1}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {player.name}
                  </span>
                </button>
              ))}
            </div>

            <Button
              className="mt-6 w-full bg-evil text-evil-foreground hover:bg-evil/90"
              size="lg"
              onClick={() => setConfirmMode(true)}
              disabled={selectedTarget === null}
            >
              <Skull className="mr-2 h-5 w-5" />
              确认刺杀目标
            </Button>
          </>
        ) : (
          <div className="animate-scale-in rounded-lg border-2 border-evil/30 bg-[hsl(0_72%_51%/0.08)] p-6 text-center">
            <Skull className="mx-auto mb-3 h-10 w-10 text-evil" />
            <h3 className="mb-2 text-lg font-bold text-evil">
              确认刺杀
            </h3>
            <p className="mb-4 text-foreground">
              刺杀目标：
              <span className="font-bold text-evil">
                {state.players.find((p) => p.id === selectedTarget)?.name}
              </span>
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              此操作不可撤销
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => setConfirmMode(false)}
              >
                返回
              </Button>
              <Button
                className="flex-1 bg-evil text-evil-foreground hover:bg-evil/90"
                size="lg"
                onClick={handleConfirmKill}
              >
                <Target className="mr-2 h-4 w-4" />
                执行刺杀
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
