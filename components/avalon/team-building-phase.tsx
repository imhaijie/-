"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Crown,
  Check,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { QUEST_TEAM_SIZE } from "@/lib/avalon/types";
import { useGame } from "@/lib/avalon/store";
import { QuestTracker } from "./quest-tracker";
import { SpeechTimer } from "./speech-timer";

export function TeamBuildingPhase() {
  const { state, dispatch } = useGame();
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(
    new Set()
  );
  const [showTimer, setShowTimer] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);

  const leader = state.players[state.currentLeaderIndex];
  const teamSize =
    QUEST_TEAM_SIZE[state.playerCount][state.currentQuest - 1];

  const toggleMember = (id: number) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < teamSize) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmitTeam = () => {
    dispatch({
      type: "SUBMIT_TEAM",
      teamMemberIds: Array.from(selectedMembers),
    });
  };

  const questResults = state.quests.map((q) => q.result);

  return (
    <div className="flex min-h-[100dvh] flex-col px-4 py-4">
      {/* Quest tracker */}
      <QuestTracker
        playerCount={state.playerCount}
        currentQuest={state.currentQuest}
        questResults={questResults}
        consecutiveRejects={state.consecutiveRejects}
      />

      {/* Header info */}
      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              第 {state.currentQuest} 轮任务
            </p>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                队长: {leader.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">需要选择</p>
            <p className="text-lg font-bold text-primary">
              {selectedMembers.size}/{teamSize}
            </p>
          </div>
        </div>
      </div>

      {/* Speech timer toggle */}
      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowTimer(!showTimer)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {showTimer ? "关闭发言计时" : "开启发言计时"}
        </Button>

        {showTimer && (
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-2">
              {state.players.map((p, i) => (
                <Button
                  key={p.id}
                  variant={currentSpeaker === i ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setCurrentSpeaker(i)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
            <SpeechTimer
              key={currentSpeaker}
              duration={state.speechTimerDuration}
              playerName={state.players[currentSpeaker].name}
              onSkip={() =>
                setCurrentSpeaker(
                  (currentSpeaker + 1) % state.players.length
                )
              }
            />
          </div>
        )}
      </div>

      {/* Player selection grid */}
      <div className="mt-4 flex-1">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          选择出征队员
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {state.players.map((player) => {
            const isSelected = selectedMembers.has(player.id);
            const isLeader =
              player.id === state.players[state.currentLeaderIndex].id;

            return (
              <button
                key={player.id}
                onClick={() => toggleMember(player.id)}
                className={`relative flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm">{player.id + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {player.name}
                  </p>
                  {isLeader && (
                    <p className="flex items-center gap-1 text-xs text-primary">
                      <Crown className="h-3 w-3" />
                      队长
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      <div className="sticky bottom-4 mt-4">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmitTeam}
          disabled={selectedMembers.size !== teamSize}
        >
          <Users className="mr-2 h-5 w-5" />
          确认队伍 ({selectedMembers.size}/{teamSize})
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
