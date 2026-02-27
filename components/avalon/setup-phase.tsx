"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Shield,
  Skull,
  Users,
  Plus,
  Minus,
  X,
  ChevronRight,
  Timer,
  Eye,
  Info,
} from "lucide-react";
import {
  ROLE_INFO,
  ALIGNMENT_COUNT,
  RECOMMENDED_ROLES,
  type Role,
} from "@/lib/avalon/types";
import { useGame } from "@/lib/avalon/store";

export function SetupPhase() {
  const { dispatch } = useGame();
  const [playerCount, setPlayerCount] = useState(7);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: 7 }, (_, i) => `P${i + 1}`)
  );
  const [roles, setRoles] = useState<Role[]>(RECOMMENDED_ROLES[7]);
  const [useLadyOfLake, setUseLadyOfLake] = useState(false);
  const [speechTimer, setSpeechTimer] = useState(60);
  const [step, setStep] = useState<"players" | "roles" | "confirm">("players");

  const alignment = ALIGNMENT_COUNT[playerCount];

  const handlePlayerCountChange = useCallback(
    (delta: number) => {
      const newCount = Math.min(12, Math.max(5, playerCount + delta));
      setPlayerCount(newCount);
      setRoles(RECOMMENDED_ROLES[newCount]);
      setPlayerNames((prev) => {
        if (newCount > prev.length) {
          return [
            ...prev,
            ...Array.from(
              { length: newCount - prev.length },
              (_, i) => `P${prev.length + i + 1}`
            ),
          ];
        }
        return prev.slice(0, newCount);
      });
    },
    [playerCount]
  );

  const handleNameChange = useCallback((index: number, name: string) => {
    setPlayerNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const goodRoles = roles.filter((r) => ROLE_INFO[r].alignment === "good");
  const evilRoles = roles.filter((r) => ROLE_INFO[r].alignment === "evil");

  const toggleRole = useCallback(
    (role: Role) => {
      const info = ROLE_INFO[role];
      const currentGood = roles.filter(
        (r) => ROLE_INFO[r].alignment === "good"
      ).length;
      const currentEvil = roles.filter(
        (r) => ROLE_INFO[r].alignment === "evil"
      ).length;

      const hasRole = roles.includes(role);

      if (hasRole) {
        // Can't remove if it would break alignment count
        if (info.alignment === "good" && currentGood <= alignment.good) return;
        if (info.alignment === "evil" && currentEvil <= alignment.evil) return;
        // Replace with base role
        const replacement: Role =
          info.alignment === "good" ? "loyal_servant" : "minion";
        const idx = roles.indexOf(role);
        const newRoles = [...roles];
        newRoles[idx] = replacement;
        setRoles(newRoles);
      } else {
        // Replace a base role with this special role
        const baseRole: Role =
          info.alignment === "good" ? "loyal_servant" : "minion";
        const idx = roles.indexOf(baseRole);
        if (idx === -1) return;
        const newRoles = [...roles];
        newRoles[idx] = role;
        setRoles(newRoles);
      }
    },
    [roles, alignment]
  );

  const canStart =
    playerNames.every((n) => n.trim().length > 0) &&
    new Set(playerNames.map((n) => n.trim())).size === playerNames.length;

  const handleStart = () => {
    dispatch({
      type: "SETUP_GAME",
      playerNames: playerNames.map((n) => n.trim()),
      roles,
      useLadyOfLake,
      speechTimerDuration: speechTimer,
    });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            阿瓦隆
          </h1>
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">The Resistance: Avalon</p>
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {(["players", "roles", "confirm"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => setStep(s)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
              {i < 2 && (
                <div className="h-px w-8 bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Players */}
        {step === "players" && (
          <div className="animate-fade-in-up space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                玩家设置
              </h2>

              {/* Player count */}
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">玩家人数</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handlePlayerCountChange(-1)}
                    disabled={playerCount <= 5}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-xl font-bold text-primary">
                    {playerCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handlePlayerCountChange(1)}
                    disabled={playerCount >= 12}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Alignment info */}
              <div className="mb-6 flex gap-4">
                <div className="flex flex-1 items-center gap-2 rounded-md bg-[hsl(210_80%_55%/0.1)] px-3 py-2">
                  <Shield className="h-4 w-4 text-good" />
                  <span className="text-sm text-good">
                    好人 {alignment.good}
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-md bg-[hsl(0_72%_51%/0.1)] px-3 py-2">
                  <Skull className="h-4 w-4 text-evil" />
                  <span className="text-sm text-evil">
                    坏人 {alignment.evil}
                  </span>
                </div>
              </div>

              {/* Player names */}
              <div className="space-y-2">
                {playerNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-8 text-center text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <Input
                      value={name}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      placeholder={`玩家 ${i + 1}`}
                      className="bg-secondary/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep("roles")}
              disabled={!canStart}
            >
              下一步：角色配置
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Roles */}
        {step === "roles" && (
          <div className="animate-fade-in-up space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Eye className="h-5 w-5 text-primary" />
                角色配置
              </h2>

              <div className="mb-4 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
                <Info className="h-4 w-4 shrink-0" />
                <span>已自动为 {playerCount} 人局推荐最佳角色配置，你也可以手动调整</span>
              </div>

              {/* Good roles */}
              <div className="mb-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-good">
                  <Shield className="h-4 w-4" />
                  正义阵营 ({goodRoles.length})
                </h3>
                <div className="space-y-1">
                  {goodRoles.map((role, i) => (
                    <div
                      key={`good-${i}`}
                      className="flex items-center justify-between rounded-md bg-[hsl(210_80%_55%/0.05)] px-3 py-2"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {ROLE_INFO[role].nameZh}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {ROLE_INFO[role].name}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-[hsl(210_80%_55%/0.15)] text-good"
                      >
                        {ROLE_INFO[role].alignment === "good" ? "好" : "坏"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evil roles */}
              <div className="mb-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-evil">
                  <Skull className="h-4 w-4" />
                  邪恶阵营 ({evilRoles.length})
                </h3>
                <div className="space-y-1">
                  {evilRoles.map((role, i) => (
                    <div
                      key={`evil-${i}`}
                      className="flex items-center justify-between rounded-md bg-[hsl(0_72%_51%/0.05)] px-3 py-2"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {ROLE_INFO[role].nameZh}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {ROLE_INFO[role].name}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-[hsl(0_72%_51%/0.15)] text-evil"
                      >
                        坏
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggle special roles */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  调整特殊角色
                </h3>
                <div className="space-y-2">
                  {(
                    [
                      "merlin",
                      "percival",
                      "unfaithful_servant",
                      "assassin",
                      "morgana",
                      "mordred",
                      "oberon",
                    ] as Role[]
                  ).map((role) => {
                    const info = ROLE_INFO[role];
                    const isActive = roles.includes(role);
                    const isGood = info.alignment === "good";

                    return (
                      <div
                        key={role}
                        className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2"
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {info.nameZh}
                            </span>
                            <span
                              className={`text-xs ${
                                isGood ? "text-good" : "text-evil"
                              }`}
                            >
                              {isGood ? "好" : "坏"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {info.description}
                          </p>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleRole(role)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => setStep("players")}
              >
                上一步
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={() => setStep("confirm")}
              >
                下一步
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="animate-fade-in-up space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Crown className="h-5 w-5 text-primary" />
                游戏设置
              </h2>

              {/* Lady of the Lake */}
              <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-secondary/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">湖中女士</p>
                  <p className="text-xs text-muted-foreground">
                    可查验一名玩家的阵营忠诚度
                  </p>
                </div>
                <Switch
                  checked={useLadyOfLake}
                  onCheckedChange={setUseLadyOfLake}
                />
              </div>

              {/* Speech timer */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Timer className="h-4 w-4 text-primary" />
                    发言倒计时
                  </span>
                  <span className="text-sm text-primary">{speechTimer}秒</span>
                </div>
                <div className="flex gap-2">
                  {[30, 45, 60, 90, 120].map((t) => (
                    <Button
                      key={t}
                      variant={speechTimer === t ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSpeechTimer(t)}
                    >
                      {t}s
                    </Button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-md border border-border bg-secondary/30 p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  游戏概览
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">玩家数</span>
                    <span className="font-medium text-foreground">{playerCount}人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">正义阵营</span>
                    <span className="font-medium text-good">
                      {goodRoles.map((r) => ROLE_INFO[r].nameZh).join("、")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">邪恶阵营</span>
                    <span className="font-medium text-evil">
                      {evilRoles.map((r) => ROLE_INFO[r].nameZh).join("、")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">湖中女士</span>
                    <span className="font-medium text-foreground">
                      {useLadyOfLake ? "启用" : "关闭"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => setStep("roles")}
              >
                上一步
              </Button>
              <Button className="flex-1" size="lg" onClick={handleStart}>
                <Crown className="mr-2 h-4 w-4" />
                开始游戏
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
