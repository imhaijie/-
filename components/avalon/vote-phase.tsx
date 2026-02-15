"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  Crown,
  Users,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useGame } from "@/lib/avalon/store";
import { QuestTracker } from "./quest-tracker";
import type { VoteChoice } from "@/lib/avalon/types";

export function VotePhase() {
  const { state, dispatch } = useGame();
  // Track who rejected - everyone else is approve by default
  const [rejecters, setRejecters] = useState<Set<number>>(new Set());

  const proposal = state.currentProposal;
  if (!proposal) return null;

  const leader = state.players.find((p) => p.id === proposal.leaderId);
  const teamMembers = state.players.filter((p) =>
    proposal.teamMemberIds.includes(p.id)
  );
  const questResults = state.quests.map((q) => q.result);

  const approveCount = state.playerCount - rejecters.size;
  const rejectCount = rejecters.size;

  const toggleReject = (playerId: number) => {
    setRejecters((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleSubmitVotes = () => {
    const votes: Record<number, VoteChoice> = {};
    state.players.forEach((p) => {
      votes[p.id] = rejecters.has(p.id) ? "reject" : "approve";
    });
    dispatch({ type: "SUBMIT_ALL_VOTES", votes });
  };

  const handleReset = () => {
    setRejecters(new Set());
  };

  return (
    <div className="flex min-h-[100dvh] flex-col px-4 py-4">
      <QuestTracker
        playerCount={state.playerCount}
        currentQuest={state.currentQuest}
        questResults={questResults}
        consecutiveRejects={state.consecutiveRejects}
      />

      {/* Team display */}
      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {leader?.name} 的组队方案
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {teamMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1"
            >
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Vote tally */}
      <div className="mt-4 flex gap-3">
        <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[hsl(210_80%_55%/0.1)] py-3">
          <ThumbsUp className="h-5 w-5 text-good" />
          <span className="text-xl font-bold text-good">{approveCount}</span>
          <span className="text-xs text-good/70">赞成</span>
        </div>
        <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[hsl(0_72%_51%/0.1)] py-3">
          <ThumbsDown className="h-5 w-5 text-evil" />
          <span className="text-xl font-bold text-evil">{rejectCount}</span>
          <span className="text-xs text-evil/70">反对</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 rounded-md bg-primary/5 px-3 py-2">
        <p className="text-center text-xs text-primary">
          线下比手势投票后，主持人点击投反对票的玩家编号，未点击即为赞成
        </p>
      </div>

      {/* Player grid - tap to toggle reject */}
      <div className="mt-3 flex-1">
        <div className="grid grid-cols-2 gap-2">
          {state.players.map((player) => {
            const isReject = rejecters.has(player.id);
            const isOnTeam = proposal.teamMemberIds.includes(player.id);

            return (
              <button
                key={player.id}
                onClick={() => toggleReject(player.id)}
                className={`relative flex items-center gap-3 rounded-lg border-2 px-3 py-3 text-left transition-all ${
                  isReject
                    ? "border-evil bg-[hsl(0_72%_51%/0.1)]"
                    : "border-good/30 bg-[hsl(210_80%_55%/0.05)]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isReject
                      ? "bg-evil text-evil-foreground"
                      : "bg-good/20 text-good"
                  }`}
                >
                  {isReject ? (
                    <ThumbsDown className="h-4 w-4" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    <span className="text-muted-foreground">{player.id + 1}.</span>{" "}
                    {player.name}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      isReject ? "text-evil" : "text-good"
                    }`}
                  >
                    {isReject ? "反对" : "赞成"}
                    {isOnTeam && (
                      <span className="ml-1 text-primary">{"(队员)"}</span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-4 mt-4 flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="shrink-0"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          className="flex-1"
          size="lg"
          onClick={handleSubmitVotes}
        >
          确认票型
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
