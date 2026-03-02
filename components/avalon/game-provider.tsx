"use client";

import { useReducer, useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import {
  fetchGameState,
  saveGameState,
  subscribeToGameState,
} from "@/lib/avalon/sync";
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
import type { HistorySnapshot, GameState } from "@/lib/avalon/types";
import type { GameAction } from "@/lib/avalon/store";
import { Loader2 } from "lucide-react";

export function GameProvider() {
  const [state, localDispatch] = useReducer(gameReducer, createInitialState());
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [previousPhase, setPreviousPhase] = useState(state.phase);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Track if state change is from remote
  const isRemoteUpdate = useRef(false);
  // Track last saved state hash to avoid duplicate saves
  const lastSavedStateHash = useRef<string>("");

  // Generate a simple hash for state comparison
  const getStateHash = (s: GameState) => JSON.stringify(s);

  // Wrapped dispatch that syncs to database
  const dispatch = useCallback(async (action: GameAction) => {
    localDispatch(action);
  }, []);

  // Load initial state from database
  useEffect(() => {
    async function loadInitialState() {
      setIsLoading(true);
      const savedState = await fetchGameState();
      
      if (savedState) {
        isRemoteUpdate.current = true;
        localDispatch({ type: "RESTORE_STATE", state: savedState });
        lastSavedStateHash.current = getStateHash(savedState);
        setPreviousPhase(savedState.phase);
        
        // If game is in progress (not setup), skip permission request
        if (savedState.phase !== "setup") {
          setPermissionGranted(true);
        }
      }
      
      setIsLoading(false);
      isRemoteUpdate.current = false;
    }
    
    loadInitialState();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToGameState((newState) => {
      const newHash = getStateHash(newState);
      
      // Only update if state is different
      if (newHash !== lastSavedStateHash.current) {
        isRemoteUpdate.current = true;
        localDispatch({ type: "RESTORE_STATE", state: newState });
        lastSavedStateHash.current = newHash;
        setPreviousPhase(newState.phase);
        
        // Auto-grant permission if game already started
        if (newState.phase !== "setup") {
          setPermissionGranted(true);
        }
        
        isRemoteUpdate.current = false;
      }
    });

    return unsubscribe;
  }, []);

  // Save state to database when it changes (debounced)
  useEffect(() => {
    // Skip if this is a remote update or initial load
    if (isRemoteUpdate.current || isLoading) return;

    const currentHash = getStateHash(state);
    
    // Skip if state hasn't actually changed
    if (currentHash === lastSavedStateHash.current) return;

    const saveTimeout = setTimeout(async () => {
      setIsSyncing(true);
      const success = await saveGameState(state);
      if (success) {
        lastSavedStateHash.current = currentHash;
      }
      setIsSyncing(false);
    }, 100); // Small debounce to batch rapid updates

    return () => clearTimeout(saveTimeout);
  }, [state, isLoading]);

  // Auto-save snapshot on phase change
  useEffect(() => {
    if (state.phase !== previousPhase && state.phase !== "setup") {
      saveSnapshot(state);
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
      localDispatch({ type: "RESTORE_STATE", state: restoredState });
      setSnapshots(getSnapshots());
      setPreviousPhase(restoredState.phase);
    }
  }, []);

  const voteHistory = useMemo(() => getVoteHistory(state), [state]);

  const showGameUI =
    state.phase !== "setup" &&
    state.phase !== "night" &&
    state.phase !== "game_over";

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">正在加载游戏状态...</p>
        </div>
      </div>
    );
  }

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
        {/* Sync indicator */}
        {isSyncing && (
          <div className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            <Loader2 className="h-3 w-3 animate-spin" />
            同步中...
          </div>
        )}
        
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
