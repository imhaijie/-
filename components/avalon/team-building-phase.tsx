"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Crown,
  Check,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { QUEST_TEAM_SIZE, type SpeechDirection } from "@/lib/avalon/types";
import { useGame } from "@/lib/avalon/store";
import { QuestTracker } from "./quest-tracker";
import { SpeechTimer } from "./speech-timer";

export function TeamBuildingPhase() {
  const { state, dispatch } = useGame();
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(
    new Set()
  );
  const [showTimer, setShowTimer] = useState(false);
  const [currentSpeakerIdx, setCurrentSpeakerIdx] = useState(0);
  const [speechDirection, setSpeechDirection] = useState<SpeechDirection>(state.speechDirection);

  const leader = state.players[state.currentLeaderIndex];
  const teamSize =
    QUEST_TEAM_SIZE[state.playerCount][state.currentQuest - 1];

  // Generate speech order based on captain's position and chosen direction
  const speechOrder = useMemo(() => {
    const order: number[] = [];
    const count = state.playerCount;
    const leaderIdx = state.currentLeaderIndex;

    for (let i = 1; i < count; i++) {
      const offset = speechDirection === "left" ? i : -i;
      const idx = ((leaderIdx + offset) % count + count) % count;
      order.push(idx);
    }
    // Captain speaks last
    order.push(leaderIdx);
    return order;
  }, [state.currentLeaderIndex, state.playerCount, speechDirection]);

  const currentSpeaker = state.players[speechOrder[currentSpeakerIdx]];
  const isLastSpeaker = currentSpeakerIdx >= speechOrder.length - 1;

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

  const handleNextSpeaker = () => {
    if (!isLastSpeaker) {
      setCurrentSpeakerIdx(currentSpeakerIdx + 1);
    }
  };

  const handleDirectionChange = (dir: SpeechDirection) => {
    setSpeechDirection(dir);
    setCurrentSpeakerIdx(0);
    dispatch({ type: "SET_SPEECH_DIRECTION", direction: dir });
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
                队长: {leader.name}（{state.currentLeaderIndex + 1}号）
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

      {/* Speech timer section */}
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
            {/* Direction selector */}
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">发言方向：</span>
              <Button
                variant={speechDirection === "left" ? "default" : "outline"}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => handleDirectionChange("left")}
              >
                <ArrowRight className="h-3 w-3" />
                左手边开始
              </Button>
              <Button
                variant={speechDirection === "right" ? "default" : "outline"}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => handleDirectionChange("right")}
              >
                <ArrowLeft className="h-3 w-3" />
                右手边开始
              </Button>
            </div>

            {/* Speaker order indicator */}
            <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1">
              {speechOrder.map((playerIdx, i) => {
                const p = state.players[playerIdx];
                const isCurrent = i === currentSpeakerIdx;
                const isDone = i < currentSpeakerIdx;
                const isCaptain = playerIdx === state.currentLeaderIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentSpeakerIdx(i)}
                    className={`relative shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                        ? "bg-secondary/60 text-muted-foreground line-through"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {isCaptain && (
                      <Crown className="mr-0.5 inline h-3 w-3" />
                    )}
                    {p.name}
                  </button>
                );
              })}
            </div>

            <SpeechTimer
              key={`${currentSpeakerIdx}-${speechDirection}`}
              duration={state.speechTimerDuration}
              playerName={currentSpeaker.name}
              onSkip={!isLastSpeaker ? handleNextSpeaker : undefined}
              onComplete={() => {
                // Auto-advance on timer completion handled by the alert
              }}
            />

            {!isLastSpeaker && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={handleNextSpeaker}
              >
                下一位发言
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Player selection grid */}
      <div className="mt-4 flex-1">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          队长选择出征队员（点击选择/取消）
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
