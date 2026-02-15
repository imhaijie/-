"use client";

import { useReducer } from "react";
import {
  GameContext,
  gameReducer,
  createInitialState,
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
import { GameLog } from "./game-log";

export function GameProvider() {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());

  const showLog =
    state.phase !== "setup" &&
    state.phase !== "night" &&
    state.phase !== "game_over";

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <div className="relative min-h-[100dvh]">
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

        {showLog && <GameLog />}
      </div>
    </GameContext.Provider>
  );
}
