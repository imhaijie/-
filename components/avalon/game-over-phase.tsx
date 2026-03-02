"use client";

import { Button } from "@/components/ui/button";
import {
  Crown,
  Shield,
  Skull,
  RotateCcw,
  Users,
  ChevronDown,
  ChevronUp,
  Target,
  ThumbsUp,
  ThumbsDown,
  Swords,
} from "lucide-react";
import { ROLE_INFO } from "@/lib/avalon/types";
import { useGame } from "@/lib/avalon/store";
import { resetGameSession } from "@/lib/avalon/sync";
import { useState } from "react";

export function GameOverPhase() {
  const { state, dispatch } = useGame();
  const [showLog, setShowLog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isGoodWin = state.winner === "good";

  const handleNewGame = async () => {
    setIsResetting(true);
    const success = await resetGameSession();
    if (success) {
      dispatch({ type: "RESET_GAME" });
    }
    setIsResetting(false);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
      {/* Result banner */}
      <div
        className={`mb-6 w-full max-w-lg animate-scale-in rounded-lg border-2 p-8 text-center ${
          isGoodWin
            ? "border-good/30 bg-[hsl(210_80%_55%/0.08)]"
            : "border-evil/30 bg-[hsl(0_72%_51%/0.08)]"
        }`}
      >
        {isGoodWin ? (
          <Crown className="mx-auto mb-4 h-16 w-16 text-good" />
        ) : (
          <Skull className="mx-auto mb-4 h-16 w-16 text-evil" />
        )}

        <h1
          className={`mb-2 text-3xl font-bold ${
            isGoodWin ? "text-good" : "text-evil"
          }`}
        >
          {isGoodWin ? "正义方获胜" : "邪恶方获胜"}
        </h1>
        <p className="text-sm text-muted-foreground">{state.winReason}</p>

        {/* Score */}
        <div className="mt-4 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-good" />
            <span className="text-lg font-bold text-good">
              {state.goodWins}
            </span>
          </div>
          <span className="text-muted-foreground">:</span>
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-evil" />
            <span className="text-lg font-bold text-evil">
              {state.evilWins}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg space-y-4">
        {/* Assassination result */}
        {state.assassinTarget !== null && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-evil" />
              <span className="text-sm font-medium text-foreground">
                刺杀结果
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              刺客刺杀了{" "}
              <span className="font-medium text-foreground">
                {state.players.find((p) => p.id === state.assassinTarget)?.name}
              </span>
              {state.players.find((p) => p.id === state.assassinTarget)?.role ===
              "merlin"
                ? "，正是梅林！"
                : "，不是梅林。"}
            </p>
          </div>
        )}

        {/* Player roles reveal */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Users className="h-4 w-4 text-primary" />
            身份揭晓
          </h3>
          <div className="space-y-2">
            {state.players.map((player) => {
              const roleInfo = player.role ? ROLE_INFO[player.role] : null;
              const isGood = player.alignment === "good";

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-md px-3 py-2 ${
                    isGood
                      ? "bg-[hsl(210_80%_55%/0.05)]"
                      : "bg-[hsl(0_72%_51%/0.05)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isGood ? (
                      <Shield className="h-4 w-4 text-good" />
                    ) : (
                      <Skull className="h-4 w-4 text-evil" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {player.name}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isGood ? "text-good" : "text-evil"
                    }`}
                  >
                    {roleInfo?.nameZh}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game log */}
        <div className="rounded-lg border border-border bg-card">
          <button
            className="flex w-full items-center justify-between p-4"
            onClick={() => setShowLog(!showLog)}
          >
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Swords className="h-4 w-4 text-primary" />
              游戏记录
            </h3>
            {showLog ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showLog && (
            <div className="border-t border-border px-4 pb-4">
              {state.quests
                .filter((q) => q.result !== "pending")
                .map((quest) => (
                  <div key={quest.questNumber} className="mt-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          quest.result === "success"
                            ? "bg-good/20 text-good"
                            : "bg-evil/20 text-evil"
                        }`}
                      >
                        {quest.questNumber}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        第{quest.questNumber}轮 -{" "}
                        {quest.result === "success" ? "成功" : "失败"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (失败票: {quest.failCount})
                      </span>
                    </div>

                    {/* Team members */}
                    <div className="mt-1 ml-8 text-xs text-muted-foreground">
                      队伍:{" "}
                      {quest.finalTeam
                        .map(
                          (id) =>
                            state.players.find((p) => p.id === id)?.name
                        )
                        .join(", ")}
                    </div>

                    {/* Proposals */}
                    {quest.proposals.length > 1 && (
                      <div className="mt-1 ml-8 text-xs text-muted-foreground">
                        共经历 {quest.proposals.length} 次组队投票
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* New game button */}
        <Button className="w-full" size="lg" onClick={handleNewGame} disabled={isResetting}>
          {isResetting ? (
            <>
              <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
              重置中...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-5 w-5" />
              开始新游戏
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
