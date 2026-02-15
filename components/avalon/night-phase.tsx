"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Shield,
  Skull,
  Crown,
} from "lucide-react";
import { ROLE_INFO, type Player } from "@/lib/avalon/types";
import { useGame } from "@/lib/avalon/store";

export function NightPhase() {
  const { state, dispatch } = useGame();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());

  const currentPlayer = state.players[currentPlayerIndex];
  const roleInfo = currentPlayer.role ? ROLE_INFO[currentPlayer.role] : null;

  // Get what this player sees during the night
  function getNightInfo(player: Player): string[] {
    const info: string[] = [];
    if (!player.role) return info;

    const evilPlayers = state.players.filter(
      (p) =>
        p.alignment === "evil" &&
        p.role !== "oberon" &&
        p.id !== player.id
    );
    const evilNames = evilPlayers.map((p) => p.name);

    switch (player.role) {
      case "merlin": {
        // Merlin sees all evil except Mordred
        const visibleEvil = state.players.filter(
          (p) =>
            p.alignment === "evil" &&
            p.role !== "mordred" &&
            p.id !== player.id
        );
        if (visibleEvil.length > 0) {
          info.push(`你看到的邪恶玩家：${visibleEvil.map((p) => p.name).join("、")}`);
        }
        break;
      }
      case "percival": {
        // Percival sees Merlin and Morgana (can't tell which is which)
        const targets = state.players.filter(
          (p) => p.role === "merlin" || p.role === "morgana"
        );
        if (targets.length > 0) {
          info.push(
            `以下玩家中有梅林（也可能有莫甘娜）：${targets.map((p) => p.name).join("、")}`
          );
        }
        break;
      }
      case "assassin":
      case "morgana":
      case "mordred":
      case "minion": {
        // Evil players see each other (except Oberon)
        if (evilNames.length > 0) {
          info.push(`你的邪恶同伴：${evilNames.join("、")}`);
        }
        break;
      }
      case "oberon": {
        info.push("你是奥伯伦，你不知道其他邪恶玩家是谁");
        break;
      }
      case "loyal_servant": {
        info.push("你是亚瑟王的忠臣，没有特殊信息");
        break;
      }
    }

    return info;
  }

  const nightInfo = getNightInfo(currentPlayer);
  const allConfirmed = confirmed.size === state.players.length;

  const handleConfirm = () => {
    setConfirmed((prev) => new Set([...prev, currentPlayerIndex]));
    setIsRevealed(false);
    if (currentPlayerIndex < state.players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    }
  };

  const handleStartGame = () => {
    dispatch({ type: "START_TEAM_BUILDING" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
      <div className="mb-6 text-center">
        <Moon className="mx-auto mb-2 h-10 w-10 text-primary" />
        <h1 className="font-serif text-2xl font-bold text-foreground">
          天黑请闭眼
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          请逐一传递手机，每位玩家确认自己的身份
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 flex w-full max-w-lg gap-1">
        {state.players.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              confirmed.has(i)
                ? "bg-primary"
                : i === currentPlayerIndex
                ? "bg-primary/50"
                : "bg-secondary"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-lg">
        {!allConfirmed ? (
          <div className="animate-scale-in rounded-lg border border-border bg-card p-6">
            {/* Current player prompt */}
            <div className="mb-6 text-center">
              <p className="mb-1 text-sm text-muted-foreground">
                第 {currentPlayerIndex + 1}/{state.players.length} 位玩家
              </p>
              <h2 className="text-2xl font-bold text-primary">
                {currentPlayer.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {confirmed.has(currentPlayerIndex)
                  ? "已确认身份"
                  : "请确保只有你能看到屏幕"}
              </p>
            </div>

            {!confirmed.has(currentPlayerIndex) && (
              <>
                {!isRevealed ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setIsRevealed(true)}
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    查看我的身份
                  </Button>
                ) : (
                  <div className="animate-fade-in-up space-y-4">
                    {/* Role card */}
                    <div
                      className={`rounded-lg border-2 p-6 text-center ${
                        roleInfo?.alignment === "good"
                          ? "border-good/30 bg-[hsl(210_80%_55%/0.08)]"
                          : "border-evil/30 bg-[hsl(0_72%_51%/0.08)]"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-center gap-2">
                        {roleInfo?.alignment === "good" ? (
                          <Shield className="h-8 w-8 text-good" />
                        ) : (
                          <Skull className="h-8 w-8 text-evil" />
                        )}
                      </div>
                      <h3
                        className={`text-2xl font-bold ${
                          roleInfo?.alignment === "good"
                            ? "text-good"
                            : "text-evil"
                        }`}
                      >
                        {roleInfo?.nameZh}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {roleInfo?.name}
                      </p>
                      <p className="mt-3 text-sm text-foreground/80">
                        {roleInfo?.description}
                      </p>
                    </div>

                    {/* Night info */}
                    {nightInfo.length > 0 && (
                      <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                        <h4 className="mb-2 text-sm font-medium text-primary">
                          夜间信息
                        </h4>
                        {nightInfo.map((info, i) => (
                          <p key={i} className="text-sm text-foreground/80">
                            {info}
                          </p>
                        ))}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleConfirm}
                    >
                      <EyeOff className="mr-2 h-5 w-5" />
                      我已记住，隐藏身份
                    </Button>
                  </div>
                )}
              </>
            )}

            {confirmed.has(currentPlayerIndex) &&
              currentPlayerIndex < state.players.length - 1 && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setCurrentPlayerIndex(currentPlayerIndex + 1);
                    setIsRevealed(false);
                  }}
                >
                  下一位玩家
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
          </div>
        ) : (
          <div className="animate-fade-in-up space-y-6 text-center">
            <div className="rounded-lg border border-primary/20 bg-card p-8">
              <Crown className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-xl font-bold text-foreground">
                所有玩家已确认身份
              </h2>
              <p className="text-sm text-muted-foreground">
                天亮了！接下来开始第一轮任务
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={handleStartGame}>
              <Crown className="mr-2 h-5 w-5" />
              开始任务
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
