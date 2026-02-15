"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  Crown,
  Users,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { useGame } from "@/lib/avalon/store";
import { QuestTracker } from "./quest-tracker";

export function VotePhase() {
  const { state, dispatch } = useGame();
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [showVote, setShowVote] = useState(true);
  const [allVoted, setAllVoted] = useState(false);

  const proposal = state.currentProposal;
  if (!proposal) return null;

  const leader = state.players.find((p) => p.id === proposal.leaderId);
  const teamMembers = state.players.filter((p) =>
    proposal.teamMemberIds.includes(p.id)
  );

  const currentVoter = state.players[currentVoterIndex];
  const hasVoted = proposal.votes[currentVoter?.id] !== undefined;
  const questResults = state.quests.map((q) => q.result);

  // Check if all votes are in
  const allVotesIn = Object.keys(proposal.votes).length === state.playerCount;

  const handleVote = (vote: "approve" | "reject") => {
    dispatch({
      type: "SUBMIT_VOTE",
      playerId: currentVoter.id,
      vote,
    });

    // Move to next voter or show results
    if (currentVoterIndex < state.players.length - 1) {
      setCurrentVoterIndex(currentVoterIndex + 1);
      setShowVote(true);
    } else {
      setAllVoted(true);
    }
  };

  // If all voted, the reducer already changed phase, so this component
  // shouldn't render. But for the transition, we show results.
  if (allVoted || allVotesIn) {
    const approveCount = Object.values(proposal.votes).filter(
      (v) => v === "approve"
    ).length;
    const rejectCount = Object.values(proposal.votes).filter(
      (v) => v === "reject"
    ).length;
    const approved = approveCount > state.playerCount / 2;

    return (
      <div className="flex min-h-[100dvh] flex-col items-center px-4 py-4">
        <QuestTracker
          playerCount={state.playerCount}
          currentQuest={state.currentQuest}
          questResults={questResults}
          consecutiveRejects={state.consecutiveRejects}
        />

        <div className="mt-6 w-full max-w-lg animate-scale-in">
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
            <p className="text-sm text-muted-foreground">
              赞成 {approveCount} : 反对 {rejectCount}
            </p>
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
                  <span className="text-sm text-foreground">{player.name}</span>
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
        </div>
      </div>
    );
  }

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

      {/* Voting area */}
      <div className="mt-6 flex-1">
        {/* Progress */}
        <div className="mb-4 flex items-center justify-center gap-1">
          {state.players.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < currentVoterIndex
                  ? "bg-primary"
                  : i === currentVoterIndex
                  ? "bg-primary/50"
                  : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <div className="animate-scale-in rounded-lg border border-border bg-card p-6 text-center">
          <p className="mb-1 text-xs text-muted-foreground">
            第 {currentVoterIndex + 1}/{state.playerCount} 位投票
          </p>
          <h2 className="mb-6 text-xl font-bold text-primary">
            {currentVoter.name}
          </h2>

          {showVote ? (
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-good text-good-foreground hover:bg-good/90"
                size="lg"
                onClick={() => handleVote("approve")}
              >
                <ThumbsUp className="mr-2 h-5 w-5" />
                赞成
              </Button>
              <Button
                className="flex-1 bg-evil text-evil-foreground hover:bg-evil/90"
                size="lg"
                onClick={() => handleVote("reject")}
              >
                <ThumbsDown className="mr-2 h-5 w-5" />
                反对
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowVote(true)}
            >
              <Eye className="mr-2 h-5 w-5" />
              显示投票按钮
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
