"use client";

import { useState } from "react";
import { useGame } from "@/lib/avalon/store";
import {
  ThumbsUp,
  ThumbsDown,
  Crown,
  Users,
  ChevronDown,
  ChevronUp,
  Shield,
  Skull,
} from "lucide-react";
import { QUEST_TEAM_SIZE } from "@/lib/avalon/types";

export function VoteHistoryBar() {
  const { state, voteHistory } = useGame();
  const [expanded, setExpanded] = useState(false);

  const currentQuest = state.currentQuest;
  const leader = state.players[state.currentLeaderIndex];
  const teamSize = QUEST_TEAM_SIZE[state.playerCount]?.[currentQuest - 1] || 0;
  const questResults = state.quests.map((q) => q.result);

  // Group vote history by quest
  const votesByQuest = voteHistory.reduce((acc, vote) => {
    if (!acc[vote.questNumber]) {
      acc[vote.questNumber] = [];
    }
    acc[vote.questNumber].push(vote);
    return acc;
  }, {} as Record<number, typeof voteHistory>);

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Main bar - always visible */}
      <div className="flex items-center gap-2 px-3 py-2 lg:px-4">
        {/* Quest progress */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((q) => {
            const result = questResults[q - 1];
            const isActive = q === currentQuest;
            const size = QUEST_TEAM_SIZE[state.playerCount]?.[q - 1] || 0;

            return (
              <div
                key={q}
                className={`flex h-8 w-8 flex-col items-center justify-center rounded-full text-xs font-bold transition-all lg:h-10 lg:w-10 ${
                  result === "success"
                    ? "bg-good/20 text-good"
                    : result === "fail"
                    ? "bg-evil/20 text-evil"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
                title={`第${q}轮: ${size}人`}
              >
                {result === "success" ? (
                  <Shield className="h-4 w-4" />
                ) : result === "fail" ? (
                  <Skull className="h-4 w-4" />
                ) : (
                  <>
                    <span className="text-[10px] leading-none">{q}</span>
                    <span className="text-[8px] leading-none opacity-70">{size}人</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Current round info */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex items-center gap-1 text-xs lg:text-sm">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">
              {leader?.name}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5">
            <Users className="h-3 w-3 text-primary" />
            <span className="text-xs font-bold text-primary">{teamSize}人</span>
          </div>
        </div>

        {/* Vote reject counter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">投票:</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i <= state.consecutiveRejects
                  ? i === 5
                    ? "bg-evil"
                    : "bg-primary"
                  : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Expand toggle */}
        {voteHistory.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {expanded ? (
              <>
                收起
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                票型
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded vote history */}
      {expanded && voteHistory.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-t border-border bg-card/50 px-3 py-2 lg:px-4">
          <div className="space-y-3">
            {Object.entries(votesByQuest).map(([questNum, votes]) => (
              <div key={questNum}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    第 {questNum} 轮
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-1.5">
                  {votes.map((vote, idx) => (
                    <div
                      key={`${questNum}-${idx}`}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                        vote.approved
                          ? "bg-good/5 border border-good/20"
                          : "bg-evil/5 border border-evil/20"
                      }`}
                    >
                      {/* Leader */}
                      <div className="flex shrink-0 items-center gap-1">
                        <Crown className="h-3 w-3 text-primary" />
                        <span className="font-medium">{vote.leaderName}</span>
                      </div>

                      {/* Team */}
                      <div className="min-w-0 flex-1 truncate text-muted-foreground">
                        {vote.teamMemberNames.join(", ")}
                      </div>

                      {/* Vote result */}
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center gap-0.5 text-good">
                          <ThumbsUp className="h-3 w-3" />
                          {vote.approveCount}
                        </span>
                        <span className="flex items-center gap-0.5 text-evil">
                          <ThumbsDown className="h-3 w-3" />
                          {vote.rejectCount}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            vote.approved
                              ? "bg-good/20 text-good"
                              : "bg-evil/20 text-evil"
                          }`}
                        >
                          {vote.approved ? "通过" : "否决"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Per-player vote breakdown */}
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              个人票型统计
            </p>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">
              {state.players.map((player) => {
                const playerVotes = voteHistory.map((v) => v.votes[player.id]);
                const approves = playerVotes.filter((v) => v === "approve").length;
                const rejects = playerVotes.filter((v) => v === "reject").length;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-2 py-1"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {player.id + 1}. {player.name}
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-good">{approves}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-evil">{rejects}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
