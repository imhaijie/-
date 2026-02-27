"use client";

import { useReducer, useState, useCallback, useMemo, useEffect } from "react";
import {
  GameContext,
  gameReducer,
  createInitialState,
  saveSnapshot,
  getSnapshots,
  restoreSnapshot,
  getVoteHistory,
  clearHistory,
} from "@/lib/avalon/store";
import { SetupPhase } from "./setup-phase";
import { NightPhase } from "./night-phase";
import { TeamBuildingPhase } from "./team-building-phase";
import { VotePhase } from "./vote-phase";
import { VoteResultPhase } from "./vote-result-phase";
import { QuestPhase } from "./quest-phase";
import { QuestResultPhase } from "./quest-result-phase";
import { AssassinationPhase } from "./assassination-phase";
import { LadyOfLakePhase } from "./lady-of-lake-phase";
import { GameOverPhase } from "./game-over-phase";
import { PermissionRequest } from "./permission-request";
import { VoteHistoryBar } from "./vote-history-bar";
import { HostControls } from "./host-controls";
import type { HistorySnapshot } from "@/lib/avalon/types";

export function GameProvider() {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [previousPhase, setPreviousPhase] = useState(state.phase);

  // Auto-save snapshot on phase change
  useEffect(() => {
    if (state.phase !== previousPhase && state.phase !== "setup") {
      const newSnapshot = saveSnapshot(state);
      setSnapshots(getSnapshots());
      setPreviousPhase(state.phase);
    }
  }, [state.phase, previousPhase, state]);

  const saveCurrentSnapshot = useCallback((label?: string) => {
    saveSnapshot(state, label);
    setSnapshots(getSnapshots());
  }, [state]);

  const restoreToSnapshot = useCallback((snapshotId: string) => {
    const restoredState = restoreSnapshot(snapshotId);
    if (restoredState) {
      dispatch({ type: "RESTORE_STATE", state: restoredState });
      setSnapshots(getSnapshots());
      setPreviousPhase(restoredState.phase);
    }
  }, []);

  const voteHistory = useMemo(() => getVoteHistory(state), [state]);

  const showGameUI =
    state.phase !== "setup" &&
    state.phase !== "night" &&
    state.phase !== "game_over";

  // Permission request screen before game setup
  if (!permissionGranted && state.phase === "setup") {
    return <PermissionRequest onComplete={() => setPermissionGranted(true)} />;
  }

  return (
    <GameContext.Provider value={{ 
      state, 
      dispatch, 
      snapshots, 
      saveCurrentSnapshot, 
      restoreToSnapshot,
      voteHistory 
    }}>
      <div className="relative flex min-h-[100dvh] flex-col">
        {/* Vote history bar - always visible during game */}
        {showGameUI && (
          <VoteHistoryBar />
        )}
        
        {/* Main content area */}
        <div className="flex-1">
          {state.phase === "setup" && <SetupPhase />}
          {state.phase === "night" && <NightPhase />}
          {state.phase === "team_building" && <TeamBuildingPhase />}
          {state.phase === "team_vote" && <VotePhase />}
          {state.phase === "vote_result" && <VoteResultPhase />}
          {state.phase === "quest" && <QuestPhase />}
          {state.phase === "quest_result" && <QuestResultPhase />}
          {state.phase === "lady_of_lake" && <LadyOfLakePhase />}
          {state.phase === "assassination" && <AssassinationPhase />}
          {state.phase === "game_over" && <GameOverPhase />}
        </div>

        {/* Host controls - always accessible during game */}
        {showGameUI && (
          <HostControls />
        )}
      </div>
    </GameContext.Provider>
  );
}
