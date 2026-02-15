"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Waves, Eye, EyeOff, Shield, Skull } from "lucide-react";
import { useGame } from "@/lib/avalon/store";

export function LadyOfLakePhase() {
  const { state, dispatch } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const holder = state.players.find(
    (p) => p.id === state.ladyOfLakeHolder
  );

  // Can't target someone who already had Lady of the Lake
  const previousHolders = new Set(
    state.ladyOfLakeHistory.map((h) => h.from)
  );

  const availableTargets = state.players.filter(
    (p) =>
      p.id !== state.ladyOfLakeHolder && !previousHolders.has(p.id)
  );

  const targetPlayer = state.players.find((p) => p.id === selectedTarget);

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleConfirm = () => {
    if (selectedTarget === null) return;
    dispatch({ type: "SUBMIT_LADY_OF_LAKE", targetId: selectedTarget });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
      <div className="mb-6 text-center">
        <Waves className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="mb-1 text-2xl font-bold text-foreground">
          湖中女士
        </h1>
        <p className="text-sm text-muted-foreground">
          {holder?.name} 持有湖中女士，可以查验一名玩家的忠诚
        </p>
      </div>

      <div className="w-full max-w-lg">
        {!revealed ? (
          <>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              选择查验目标
            </h3>
            <div className="space-y-2">
              {availableTargets.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedTarget(player.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                    selectedTarget === player.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      selectedTarget === player.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm">{player.id + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {player.name}
                  </span>
                </button>
              ))}
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={handleReveal}
              disabled={selectedTarget === null}
            >
              <Eye className="mr-2 h-5 w-5" />
              查验忠诚
            </Button>
          </>
        ) : (
          <div className="animate-scale-in space-y-4">
            <div
              className={`rounded-lg border-2 p-6 text-center ${
                targetPlayer?.alignment === "good"
                  ? "border-good/30 bg-[hsl(210_80%_55%/0.08)]"
                  : "border-evil/30 bg-[hsl(0_72%_51%/0.08)]"
              }`}
            >
              {targetPlayer?.alignment === "good" ? (
                <Shield className="mx-auto mb-3 h-12 w-12 text-good" />
              ) : (
                <Skull className="mx-auto mb-3 h-12 w-12 text-evil" />
              )}
              <h3 className="text-lg font-bold text-foreground">
                {targetPlayer?.name}
              </h3>
              <p
                className={`mt-1 text-lg font-bold ${
                  targetPlayer?.alignment === "good"
                    ? "text-good"
                    : "text-evil"
                }`}
              >
                {targetPlayer?.alignment === "good" ? "忠诚" : "邪恶"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                仅 {holder?.name} 可查看此结果，请勿让其他人看到
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handleConfirm}>
              确认，继续游戏
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
