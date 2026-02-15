"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Skull, Swords, Eye, EyeOff } from "lucide-react";
import { useGame } from "@/lib/avalon/store";
import { QuestTracker } from "./quest-tracker";

export function QuestPhase() {
  const { state, dispatch } = useGame();
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);

  const proposal = state.currentProposal;
  if (!proposal) return null;

  const teamMembers = proposal.teamMemberIds.map((id) =>
    state.players.find((p) => p.id === id)!
  );
  const currentMember = teamMembers[currentMemberIndex];
  const currentQuest = state.quests[state.quests.length - 1];
  const questResults = state.quests.map((q) => q.result);

  const handleQuestVote = (choice: "success" | "fail") => {
    dispatch({
      type: "SUBMIT_QUEST_VOTE",
      playerId: currentMember.id,
      choice,
    });

    if (currentMemberIndex < teamMembers.length - 1) {
      setCurrentMemberIndex(currentMemberIndex + 1);
      setShowChoices(false);
    }
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
        <div className="mb-6 rounded-lg border border-primary/20 bg-card p-4 text-center">
          <Swords className="mx-auto mb-2 h-8 w-8 text-primary" />
          <h2 className="text-lg font-bold text-foreground">执行任务</h2>
          <p className="text-sm text-muted-foreground">
            第 {state.currentQuest} 轮任务
            {currentQuest.requiresDoubleFail && (
              <span className="ml-1 text-primary">
                (需要2张失败牌才会失败)
              </span>
            )}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-4 flex items-center justify-center gap-1">
          {teamMembers.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < currentMemberIndex
                  ? "bg-primary"
                  : i === currentMemberIndex
                  ? "bg-primary/50"
                  : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Current member voting */}
        <div className="animate-scale-in rounded-lg border border-border bg-card p-6 text-center">
          <p className="mb-1 text-xs text-muted-foreground">
            队员 {currentMemberIndex + 1}/{teamMembers.length}
          </p>
          <h3 className="mb-2 text-xl font-bold text-primary">
            {currentMember.name}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            请确保只有你能看到屏幕，然后选择任务结果
          </p>

          {!showChoices ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowChoices(true)}
            >
              <Eye className="mr-2 h-5 w-5" />
              查看并执行任务
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-good text-good-foreground hover:bg-good/90"
                size="lg"
                onClick={() => handleQuestVote("success")}
              >
                <Shield className="mr-2 h-5 w-5" />
                成功
              </Button>
              <Button
                className="flex-1 bg-evil text-evil-foreground hover:bg-evil/90"
                size="lg"
                onClick={() => handleQuestVote("fail")}
              >
                <Skull className="mr-2 h-5 w-5" />
                失败
              </Button>
            </div>
          )}
        </div>

        {/* Team list */}
        <div className="mt-4 rounded-md border border-border bg-card/50 p-3">
          <p className="mb-2 text-xs text-muted-foreground">出征队员</p>
          <div className="flex flex-wrap gap-1.5">
            {teamMembers.map((m, i) => (
              <div
                key={m.id}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  i < currentMemberIndex
                    ? "bg-primary/20 text-primary"
                    : i === currentMemberIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {m.name}
                {i < currentMemberIndex && (
                  <span className="ml-1">&#10003;</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
