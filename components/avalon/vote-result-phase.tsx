"use client";

import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ChevronRight, AlertTriangle } from "lucide-react";
import { useGame } from "@/lib/avalon/store";
import { QuestTracker } from "./quest-tracker";
import { MAX_REJECTS } from "@/lib/avalon/types";

export function VoteResultPhase() {
  const { state, dispatch } = useGame();

  const proposal = state.currentProposal;
  if (!proposal) return null;

  const approved = proposal.approved;
  const approveCount = Object.values(proposal.votes).filter(
    (v) => v === "approve"
  ).length;
  const rejectCount = Object.values(proposal.votes).filter(
    (v) => v === "reject"
  ).length;

  const questResults = state.quests.map((q) => q.result);
  const nextRejects = state.consecutiveRejects + (approved ? 0 : 1);

  const handleContinue = () => {
    dispatch({ type: "CONFIRM_VOTE_RESULT" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 py-4">
      <QuestTracker
        playerCount={state.playerCount}
        currentQuest={state.currentQuest}
        questResults={questResults}
        consecutiveRejects={state.consecutiveRejects}
      />

      <div className="mt-6 w-full max-w-lg animate-scale-in">
        {/* Result banner */}
        <div
          className={`rounded-lg border-2 p-6 text-center ${
            approved
              ? "border-good/30 bg-[hsl(210_80%_55%/0.08)]"
              : "border-evil/30 bg-[hsl(0_72%_51%/0.08)]"
          }`}
        >
          <h2
            className={`mb-2 text-2xl font-bold ${
              approved ? "text-good" : "text-evil"
            }`}
          >
            {approved ? "投票通过" : "投票否决"}
          </h2>
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1 text-good">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-lg font-bold">{approveCount}</span>
            </span>
            <span className="text-muted-foreground">:</span>
            <span className="flex items-center gap-1 text-evil">
              <ThumbsDown className="h-4 w-4" />
              <span className="text-lg font-bold">{rejectCount}</span>
            </span>
          </div>
        </div>

        {/* Detailed votes */}
        <div className="mt-4 space-y-1">
          {state.players.map((player) => {
            const vote = proposal.votes[player.id];
            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-md bg-card px-3 py-2"
              >
                <span className="text-sm text-foreground">
                  <span className="text-muted-foreground">{player.id + 1}.</span>{" "}
                  {player.name}
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${
                    vote === "approve" ? "text-good" : "text-evil"
                  }`}
                >
                  {vote === "approve" ? (
                    <>
                      <ThumbsUp className="h-3.5 w-3.5" /> 赞成
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="h-3.5 w-3.5" /> 反对
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Warning for consecutive rejects */}
        {!approved && nextRejects >= 3 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-evil/30 bg-[hsl(0_72%_51%/0.08)] p-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-evil" />
            <p className="text-sm text-evil">
              {nextRejects >= MAX_REJECTS
                ? "已连续否决5次，邪恶方直接获胜！"
                : `已连续否决 ${nextRejects} 次（5次则邪恶方获胜）`}
            </p>
          </div>
        )}

        <Button className="mt-6 w-full" size="lg" onClick={handleContinue}>
          {approved ? "前往执行任务" : "下一位队长组队"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
