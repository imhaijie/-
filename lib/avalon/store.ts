"use client";

import { createContext, useContext } from "react";
import type {
  GameState,
  GamePhase,
  Player,
  Role,
  VoteChoice,
  QuestChoice,
  QuestRecord,
  TeamProposal,
  Alignment,
} from "./types";
import {
  QUEST_TEAM_SIZE,
  DOUBLE_FAIL_QUESTS,
  ALIGNMENT_COUNT,
  RECOMMENDED_ROLES,
  ROLE_INFO,
  MAX_REJECTS,
  QUESTS_TO_WIN,
} from "./types";

export function createInitialState(): GameState {
  return {
    phase: "setup",
    players: [],
    playerCount: 0,
    roles: [],
    currentQuest: 1,
    quests: [],
    currentLeaderIndex: 0,
    currentProposal: null,
    consecutiveRejects: 0,
    goodWins: 0,
    evilWins: 0,
    assassinTarget: null,
    winner: null,
    winReason: "",
    speechTimerDuration: 60,
    ladyOfLakeHolder: null,
    ladyOfLakeHistory: [],
    useLadyOfLake: false,
  };
}

// Shuffle array using Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getRecommendedRoles(count: number): Role[] {
  return RECOMMENDED_ROLES[count] || RECOMMENDED_ROLES[5];
}

export function setupGame(
  playerNames: string[],
  roles: Role[],
  useLadyOfLake: boolean,
  speechTimerDuration: number
): GameState {
  const playerCount = playerNames.length;
  const shuffledRoles = shuffle(roles);

  const players: Player[] = playerNames.map((name, i) => ({
    id: i,
    name,
    role: shuffledRoles[i],
    alignment: ROLE_INFO[shuffledRoles[i]].alignment,
  }));

  // Random first leader
  const firstLeader = Math.floor(Math.random() * playerCount);

  return {
    ...createInitialState(),
    phase: "night",
    players,
    playerCount,
    roles: shuffledRoles,
    currentLeaderIndex: firstLeader,
    speechTimerDuration,
    useLadyOfLake,
    // Lady of the Lake holder is the player to the right of the first leader
    ladyOfLakeHolder: useLadyOfLake
      ? (firstLeader - 1 + playerCount) % playerCount
      : null,
  };
}

export function createQuestRecord(
  questNumber: number,
  playerCount: number
): QuestRecord {
  const teamSize = QUEST_TEAM_SIZE[playerCount][questNumber - 1];
  const requiresDoubleFail = DOUBLE_FAIL_QUESTS[playerCount].includes(questNumber);

  return {
    questNumber,
    teamSize,
    requiresDoubleFail,
    proposals: [],
    finalTeam: [],
    questVotes: {},
    result: "pending",
    failCount: 0,
  };
}

export function submitTeamProposal(
  state: GameState,
  teamMemberIds: number[]
): GameState {
  const proposal: TeamProposal = {
    leaderId: state.players[state.currentLeaderIndex].id,
    teamMemberIds,
    votes: {},
    approved: null,
  };

  return {
    ...state,
    phase: "team_vote",
    currentProposal: proposal,
  };
}

export function submitVote(
  state: GameState,
  playerId: number,
  vote: VoteChoice
): GameState {
  if (!state.currentProposal) return state;

  const updatedVotes = {
    ...state.currentProposal.votes,
    [playerId]: vote,
  };

  const updatedProposal = {
    ...state.currentProposal,
    votes: updatedVotes,
  };

  // Check if all players have voted
  if (Object.keys(updatedVotes).length === state.playerCount) {
    const approveCount = Object.values(updatedVotes).filter(
      (v) => v === "approve"
    ).length;
    const approved = approveCount > state.playerCount / 2;

    updatedProposal.approved = approved;

    // Always go to vote_result first to show results
    return {
      ...state,
      phase: "vote_result",
      currentProposal: updatedProposal,
    };
  }

  return {
    ...state,
    currentProposal: updatedProposal,
  };
}

export function submitQuestVote(
  state: GameState,
  playerId: number,
  choice: QuestChoice
): GameState {
  if (!state.currentProposal) return state;

  const currentQuest = state.quests[state.quests.length - 1];
  const updatedQuestVotes = {
    ...currentQuest.questVotes,
    [playerId]: choice,
  };

  const teamSize = state.currentProposal.teamMemberIds.length;

  if (Object.keys(updatedQuestVotes).length === teamSize) {
    const failCount = Object.values(updatedQuestVotes).filter(
      (v) => v === "fail"
    ).length;

    const requiresDoubleFail = currentQuest.requiresDoubleFail;
    const questFailed = requiresDoubleFail ? failCount >= 2 : failCount >= 1;
    const result = questFailed ? "fail" : "success";

    const newGoodWins = state.goodWins + (result === "success" ? 1 : 0);
    const newEvilWins = state.evilWins + (result === "fail" ? 1 : 0);

    const updatedQuest: QuestRecord = {
      ...currentQuest,
      finalTeam: state.currentProposal.teamMemberIds,
      questVotes: updatedQuestVotes,
      result,
      failCount,
      proposals: [...currentQuest.proposals, state.currentProposal],
    };

    let nextPhase: GamePhase = "quest_result";
    let winner: Alignment | null = null;
    let winReason = "";

    if (newEvilWins >= QUESTS_TO_WIN) {
      nextPhase = "game_over";
      winner = "evil";
      winReason = "三个任务失败，邪恶方获胜！";
    }

    return {
      ...state,
      phase: nextPhase,
      quests: [
        ...state.quests.slice(0, -1),
        updatedQuest,
      ],
      goodWins: newGoodWins,
      evilWins: newEvilWins,
      winner,
      winReason,
      currentProposal: null,
    };
  }

  return {
    ...state,
    quests: [
      ...state.quests.slice(0, -1),
      { ...currentQuest, questVotes: updatedQuestVotes },
    ],
  };
}

export function advanceToNextQuest(state: GameState): GameState {
  // Check if good won 3 quests -> go to assassination
  if (state.goodWins >= QUESTS_TO_WIN) {
    // Check if assassin exists
    const hasAssassin = state.players.some((p) => p.role === "assassin");
    if (hasAssassin) {
      return {
        ...state,
        phase: "assassination",
      };
    }
    return {
      ...state,
      phase: "game_over",
      winner: "good",
      winReason: "三个任务成功完成，正义方获胜！",
    };
  }

  const nextQuest = state.currentQuest + 1;
  const nextLeader = (state.currentLeaderIndex + 1) % state.playerCount;
  const newQuestRecord = createQuestRecord(nextQuest, state.playerCount);

  // Check if Lady of the Lake should be used (after quest 2, 3, 4)
  if (state.useLadyOfLake && state.currentQuest >= 2 && state.currentQuest <= 4) {
    return {
      ...state,
      phase: "lady_of_lake",
      currentQuest: nextQuest,
      currentLeaderIndex: nextLeader,
      consecutiveRejects: 0,
      quests: [...state.quests, newQuestRecord],
    };
  }

  return {
    ...state,
    phase: "team_building",
    currentQuest: nextQuest,
    currentLeaderIndex: nextLeader,
    consecutiveRejects: 0,
    quests: [...state.quests, newQuestRecord],
  };
}

export function submitAssassination(
  state: GameState,
  targetId: number
): GameState {
  const targetPlayer = state.players.find((p) => p.id === targetId);
  const isMerlin = targetPlayer?.role === "merlin";

  return {
    ...state,
    phase: "game_over",
    assassinTarget: targetId,
    winner: isMerlin ? "evil" : "good",
    winReason: isMerlin
      ? "刺客成功刺杀了梅林，邪恶方获胜！"
      : "刺客未能刺中梅林，正义方获胜！",
  };
}

export function submitLadyOfLake(
  state: GameState,
  targetId: number
): GameState {
  const targetPlayer = state.players.find((p) => p.id === targetId);

  return {
    ...state,
    phase: "team_building",
    ladyOfLakeHolder: targetId,
    ladyOfLakeHistory: [
      ...state.ladyOfLakeHistory,
      {
        from: state.ladyOfLakeHolder!,
        to: targetId,
        result: targetPlayer?.alignment || "good",
      },
    ],
  };
}

// Game State Context
export const GameContext = createContext<{
  state: GameState;
  dispatch: (action: GameAction) => void;
} | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export type GameAction =
  | { type: "SETUP_GAME"; playerNames: string[]; roles: Role[]; useLadyOfLake: boolean; speechTimerDuration: number }
  | { type: "START_TEAM_BUILDING" }
  | { type: "SUBMIT_TEAM"; teamMemberIds: number[] }
  | { type: "SUBMIT_VOTE"; playerId: number; vote: VoteChoice }
  | { type: "SUBMIT_QUEST_VOTE"; playerId: number; choice: QuestChoice }
  | { type: "ADVANCE_QUEST" }
  | { type: "SUBMIT_ASSASSINATION"; targetId: number }
  | { type: "SUBMIT_LADY_OF_LAKE"; targetId: number }
  | { type: "RESET_GAME" }
  | { type: "SET_PHASE"; phase: GamePhase };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SETUP_GAME":
      return setupGame(
        action.playerNames,
        action.roles,
        action.useLadyOfLake,
        action.speechTimerDuration
      );

    case "START_TEAM_BUILDING": {
      const firstQuest = createQuestRecord(1, state.playerCount);
      return {
        ...state,
        phase: "team_building",
        currentQuest: 1,
        quests: [firstQuest],
      };
    }

    case "SUBMIT_TEAM":
      return submitTeamProposal(state, action.teamMemberIds);

    case "SUBMIT_VOTE":
      return submitVote(state, action.playerId, action.vote);

    case "SUBMIT_QUEST_VOTE":
      return submitQuestVote(state, action.playerId, action.choice);

    case "ADVANCE_QUEST":
      return advanceToNextQuest(state);

    case "SUBMIT_ASSASSINATION":
      return submitAssassination(state, action.targetId);

    case "SUBMIT_LADY_OF_LAKE":
      return submitLadyOfLake(state, action.targetId);

    case "RESET_GAME":
      return createInitialState();

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    default:
      return state;
  }
}
