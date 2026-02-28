"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Skull, Swords, ChevronRight, Minus, Plus, AlertTriangle } from "lucide-react";
import { useGame } from "@/lib/avalon/store";
import { ROLE_INFO } from "@/lib/avalon/types";
import { QuestTracker } from "./quest-tracker";

export function QuestPhase() {
  const { state, dispatch } = useGame();
  const [failCount, setFailCount] = useState(0);

  const proposal = state.currentProposal;
  if (!proposal) return null;

  const teamMembers = proposal.teamMemberIds.map((id) =>
    state.players.find((p) => p.id === id)!
  );
  const currentQuest = state.quests[state.quests.length - 1];
  const questResults = state.quests.map((q) => q.result);
  const teamSize = teamMembers.length;

  // Check if there's an unfaithful servant in the game
  const hasUnfaithfulServant = state.roles.includes("unfaithful_servant");
  
  // Count potential fail cards (evil players + unfaithful servant)
  const teamMemberRoles = teamMembers.map((m) => m.role);
  const evilOnTeam = teamMemberRoles.filter((r) => r && ROLE_INFO[r]?.alignment === "evil").length;
  const unfaithfulOnTeam = teamMemberRoles.filter((r) => r === "unfaithful_servant").length;
  const maxPossibleFails = evilOnTeam + unfaithfulOnTeam;

  const handleSubmit = () => {
    dispatch({ type: "SUBMIT_QUEST_RESULT", failCount });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-4">
      <QuestTracker
        playerCount={state.playerCount}
        currentQuest={state.currentQuest}
        questResults={questResults}
        consecutiveRejects={state.consecutiveRejects}
      />

      <div className="mt-6 w-full max-w-lg">
        {/* Quest info */}
        <div className="mb-4 rounded-lg border border-primary/20 bg-card p-4 text-center">
          <Swords className="mx-auto mb-2 h-8 w-8 text-primary" />
          <h2 className="text-lg font-bold text-foreground">执行任务</h2>
          <p className="text-sm text-muted-foreground">
            第 {state.currentQuest} 轮任务
            {currentQuest.requiresDoubleFail && (
              <span className="ml-1 font-medium text-primary">
                （需要2张失败牌才会失败）
              </span>
            )}
          </p>
        </div>

        {/* Team members */}
        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            出征队员（{teamSize}人）
          </p>
          <div className="flex flex-wrap gap-1.5">
            {teamMembers.map((m) => (
              <span
                key={m.id}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-foreground"
              >
                {m.id + 1}. {m.name}
              </span>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 space-y-2">
          <div className="rounded-md bg-primary/5 px-3 py-2">
            <p className="text-center text-xs text-primary">
              收集队员的任务卡牌后，请主持人洗匀后翻开，统计失败牌数量
            </p>
          </div>
          
          {/* Unfaithful servant warning */}
          {hasUnfaithfulServant && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                本局存在「不忠诚的仆人」，好人阵营也可能出失败牌！
              </p>
            </div>
          )}
        </div>

        {/* Fail count selector */}
        <div className="rounded-lg border-2 border-border bg-card p-6">
          <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">
            失败牌数量
          </h3>

          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => setFailCount(Math.max(0, failCount - 1))}
              disabled={failCount <= 0}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <div className="flex flex-col items-center">
              <span className={`text-5xl font-bold tabular-nums ${failCount > 0 ? "text-evil" : "text-good"}`}>
                {failCount}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                / {teamSize} 张
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => setFailCount(Math.min(teamSize, failCount + 1))}
              disabled={failCount >= teamSize}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick buttons for common counts */}
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: teamSize + 1 }, (_, i) => i).map((n) => (
              <Button
                key={n}
                variant={failCount === n ? "default" : "outline"}
                size="sm"
                className={`h-9 w-9 p-0 ${n > 0 ? "border-evil/30" : ""} ${failCount === n && n > 0 ? "bg-evil text-evil-foreground hover:bg-evil/90" : ""}`}
                onClick={() => setFailCount(n)}
              >
                {n}
              </Button>
            ))}
          </div>

          {/* Result preview */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-good" />
              <span className="text-sm text-good">
                成功: {teamSize - failCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Skull className="h-4 w-4 text-evil" />
              <span className="text-sm text-evil">
                失败: {failCount}
              </span>
            </div>
          </div>
        </div>

        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={handleSubmit}
        >
          确认任务结果
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
