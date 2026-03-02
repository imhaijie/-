"use client";

import { useGame } from "@/lib/avalon/store";
import {
  ThumbsUp,
  ThumbsDown,
  Crown,
  Users,
  Shield,
  Skull,
} from "lucide-react";
import { QUEST_TEAM_SIZE } from "@/lib/avalon/types";

export function VoteHistoryBar() {
  const { state, voteHistory } = useGame();

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
      {/* Main bar - current round info with larger display */}
      <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
        {/* Quest progress - larger circles */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((q) => {
            const result = questResults[q - 1];
            const isActive = q === currentQuest;
            const size = QUEST_TEAM_SIZE[state.playerCount]?.[q - 1] || 0;

            return (
              <div
                key={q}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-full font-bold transition-all lg:h-14 lg:w-14 ${
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
                  <Shield className="h-6 w-6 lg:h-7 lg:w-7" />
                ) : result === "fail" ? (
                  <Skull className="h-6 w-6 lg:h-7 lg:w-7" />
                ) : (
                  <>
                    <span className="text-lg font-bold leading-none lg:text-xl">{size}</span>
                    <span className="text-[10px] leading-none opacity-70">人</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-border" />

        {/* Current round info - larger */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex items-center gap-2 text-base lg:text-lg">
            <Crown className="h-5 w-5 text-primary lg:h-6 lg:w-6" />
            <span className="font-semibold text-foreground">
              {leader?.name}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-1.5">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-primary lg:text-xl">{teamSize}人出征</span>
          </div>
        </div>

        {/* Vote reject counter - larger */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground lg:text-base">连续否决:</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full transition-all lg:h-5 lg:w-5 ${
                  i <= state.consecutiveRejects
                    ? i === 5
                      ? "bg-evil"
                      : "bg-primary"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Vote history - always expanded, larger text */}
      {voteHistory.length > 0 && (
        <div className="max-h-96 overflow-y-auto border-t border-border bg-card/50 px-4 py-4 lg:px-6">
          <div className="space-y-5">
            {Object.entries(votesByQuest).map(([questNum, votes]) => {
              const questResult = questResults[Number(questNum) - 1];
              
              return (
                <div key={questNum}>
                  {/* Quest header with result */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-base font-bold text-foreground lg:text-lg">
                      第 {questNum} 轮
                    </span>
                    {questResult && (
                      <span
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-semibold lg:text-base ${
                          questResult === "success"
                            ? "bg-good/20 text-good"
                            : "bg-evil/20 text-evil"
                        }`}
                      >
                        {questResult === "success" ? (
                          <>
                            <Shield className="h-4 w-4 lg:h-5 lg:w-5" />
                            任务成功
                          </>
                        ) : (
                          <>
                            <Skull className="h-4 w-4 lg:h-5 lg:w-5" />
                            任务失败
                          </>
                        )}
                      </span>
                    )}
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Vote records */}
                  <div className="space-y-3">
                    {votes.map((vote, idx) => (
                      <div
                        key={`${questNum}-${idx}`}
                        className={`rounded-xl border-2 p-4 ${
                          vote.approved
                            ? "border-good/40 bg-good/5"
                            : "border-evil/40 bg-evil/5"
                        }`}
                      >
                        {/* Leader and team */}
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-primary" />
                            <span className="text-base font-bold text-foreground lg:text-lg">
                              {vote.leaderName}
                            </span>
                          </div>
                          <span className="text-lg text-muted-foreground">{">"}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {vote.teamMemberNames.map((name, i) => (
                              <span
                                key={i}
                                className="rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-foreground lg:text-base"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                          <span
                            className={`ml-auto rounded-lg px-3 py-1 text-base font-bold lg:text-lg ${
                              vote.approved
                                ? "bg-good/20 text-good"
                                : "bg-evil/20 text-evil"
                            }`}
                          >
                            {vote.approved ? "通过" : "否决"}
                          </span>
                        </div>

                        {/* Individual votes - who voted what */}
                        <div className="flex flex-wrap gap-2">
                          {state.players.map((player) => {
                            const playerVote = vote.votes[player.id];
                            if (!playerVote) return null;
                            const isApprove = playerVote === "approve";

                            return (
                              <div
                                key={player.id}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium lg:text-base ${
                                  isApprove
                                    ? "bg-good/20 text-good"
                                    : "bg-evil/20 text-evil"
                                }`}
                              >
                                {isApprove ? (
                                  <ThumbsUp className="h-4 w-4 lg:h-5 lg:w-5" />
                                ) : (
                                  <ThumbsDown className="h-4 w-4 lg:h-5 lg:w-5" />
                                )}
                                <span>{player.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
