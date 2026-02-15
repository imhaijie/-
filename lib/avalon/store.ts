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
  SpeechDirection,
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
    speechDirection: "left",
  };
}

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

// ============================================================
// Game State Context
// ============================================================
export const GameContext = createContext<{
  state: GameState;
  dispatch: (action: GameAction) => void;
} | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// ============================================================
// Actions
// ============================================================
export type GameAction =
  | { type: "SETUP_GAME"; playerNames: string[]; roles: Role[]; useLadyOfLake: boolean; speechTimerDuration: number }
  | { type: "START_TEAM_BUILDING" }
  | { type: "SET_SPEECH_DIRECTION"; direction: SpeechDirection }
  | { type: "SUBMIT_TEAM"; teamMemberIds: number[] }
  | { type: "SUBMIT_ALL_VOTES"; votes: Record<number, VoteChoice> }
  | { type: "CONFIRM_VOTE_RESULT" }
  | { type: "SUBMIT_QUEST_RESULT"; failCount: number }
  | { type: "ADVANCE_QUEST" }
  | { type: "SUBMIT_ASSASSINATION"; targetId: number }
  | { type: "SUBMIT_LADY_OF_LAKE"; targetId: number }
  | { type: "RESET_GAME" }
  | { type: "SET_PHASE"; phase: GamePhase };

// ============================================================
// Reducer
// ============================================================
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

    case "SET_SPEECH_DIRECTION":
      return { ...state, speechDirection: action.direction };

    case "SUBMIT_TEAM": {
      const proposal: TeamProposal = {
        leaderId: state.players[state.currentLeaderIndex].id,
        teamMemberIds: action.teamMemberIds,
        votes: {},
        approved: null,
      };
      return {
        ...state,
        phase: "team_vote",
        currentProposal: proposal,
      };
    }

    case "SUBMIT_ALL_VOTES": {
      if (!state.currentProposal) return state;

      const approveCount = Object.values(action.votes).filter(
        (v) => v === "approve"
      ).length;
      const approved = approveCount > state.playerCount / 2;

      const updatedProposal: TeamProposal = {
        ...state.currentProposal,
        votes: action.votes,
        approved,
      };

      return {
        ...state,
        phase: "vote_result",
        currentProposal: updatedProposal,
      };
    }

    case "CONFIRM_VOTE_RESULT": {
      if (!state.currentProposal) return state;
      const approved = state.currentProposal.approved;

      if (approved) {
        // Move to quest phase
        return {
          ...state,
          phase: "quest",
          consecutiveRejects: 0,
        };
      } else {
        const newRejects = state.consecutiveRejects + 1;
        if (newRejects >= MAX_REJECTS) {
          return {
            ...state,
            phase: "game_over",
            consecutiveRejects: newRejects,
            winner: "evil",
            winReason: "连续5次组队投票被否决，邪恶方获胜！",
          };
        }

        const nextLeader = (state.currentLeaderIndex + 1) % state.playerCount;

        return {
          ...state,
          phase: "team_building",
          currentLeaderIndex: nextLeader,
          consecutiveRejects: newRejects,
          quests: state.quests.map((q, i) =>
            i === state.quests.length - 1
              ? { ...q, proposals: [...q.proposals, state.currentProposal!] }
              : q
          ),
          currentProposal: null,
        };
      }
    }

    case "SUBMIT_QUEST_RESULT": {
      if (!state.currentProposal) return state;
      const currentQuest = state.quests[state.quests.length - 1];
      const failCount = action.failCount;
      const requiresDoubleFail = currentQuest.requiresDoubleFail;
      const questFailed = requiresDoubleFail ? failCount >= 2 : failCount >= 1;
      const result = questFailed ? "fail" : "success";

      const newGoodWins = state.goodWins + (result === "success" ? 1 : 0);
      const newEvilWins = state.evilWins + (result === "fail" ? 1 : 0);

      const updatedQuest: QuestRecord = {
        ...currentQuest,
        finalTeam: state.currentProposal.teamMemberIds,
        questVotes: {},
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
        quests: [...state.quests.slice(0, -1), updatedQuest],
        goodWins: newGoodWins,
        evilWins: newEvilWins,
        winner,
        winReason,
        currentProposal: null,
      };
    }

    case "ADVANCE_QUEST": {
      if (state.goodWins >= QUESTS_TO_WIN) {
        const hasAssassin = state.players.some((p) => p.role === "assassin");
        if (hasAssassin) {
          return { ...state, phase: "assassination" };
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

    case "SUBMIT_ASSASSINATION": {
      const targetPlayer = state.players.find((p) => p.id === action.targetId);
      const isMerlin = targetPlayer?.role === "merlin";
      return {
        ...state,
        phase: "game_over",
        assassinTarget: action.targetId,
        winner: isMerlin ? "evil" : "good",
        winReason: isMerlin
          ? "刺客成功刺杀了梅林，邪恶方获胜！"
          : "刺客未能刺中梅林，正义方获胜！",
      };
    }

    case "SUBMIT_LADY_OF_LAKE": {
      const targetPlayer = state.players.find((p) => p.id === action.targetId);
      return {
        ...state,
        phase: "team_building",
        ladyOfLakeHolder: action.targetId,
        ladyOfLakeHistory: [
          ...state.ladyOfLakeHistory,
          {
            from: state.ladyOfLakeHolder!,
            to: action.targetId,
            result: targetPlayer?.alignment || "good",
          },
        ],
      };
    }

    case "RESET_GAME":
      return createInitialState();

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    default:
      return state;
  }
}
